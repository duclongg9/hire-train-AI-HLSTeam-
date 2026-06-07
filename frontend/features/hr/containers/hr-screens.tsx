"use client"

import { type MouseEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  Edit3,
  FileText,
  Filter,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  LayoutGrid,
  List,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from "lucide-react"
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { PageHeader } from '@/shared/layout/page-header'
import { EmptyState, FormMessage, ScoreBar, StatCard, StatusPill, UploadPanel } from "@/shared/components/recruitment-common"
import { JdErrorModal, SecurityAuthModal } from "@/shared/components/recruitment-modals"
import {
  candidates,
  campaigns,
  extractedSkills,
  interviewTranscript,
  pipelineStages,
  radarData,
  sourceData,
  testQuestions,
  type Candidate,
  type CandidateStatus,
  type RubricSkill,
  type TestQuestion,
} from "@/lib/recruitment/mock-data"
import {
  createCampaign,
  extractRubricFromJdFile,
  formatApiError,
  generateTestQuestions,
  healthCheck,
  listCampaigns,
  listLeaderboard,
  listTestQuestions,
  publishPosition,
  saveTestQuestions,
  finalDecision,
  inviteCandidateToInterview,
  inviteCandidateToTest,
  scorePositionCandidates,
  type BackendCampaign,
  type BackendLeaderboardRow,
  type BackendRubricCriterion,
  type BackendTestQuestion,
} from "@/features/hr/api/hr-api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

function useRouteCampaignId() {
  const params = useParams<{ campaignId?: string }>()
  return params?.campaignId ?? ""
}

function rememberActiveCampaign(campaignId: string) {
  if (typeof window !== "undefined" && campaignId) {
    window.localStorage.setItem("activeCampaignId", campaignId)
  }
}

function getRememberedCampaignId() {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem("activeCampaignId") ?? ""
}

function toCandidateStatus(status: string): CandidateStatus {
  if (status === "PASSED" || status === "CONTACTED") return "Offer"
  if (status === "REJECTED") return "Rejected"
  if (status.startsWith("INTERVIEW")) return "Interview"
  if (status.startsWith("TEST")) return "Test Sent"
  if (status === "CV_SCORED" || status === "SHORTLISTED") return "CV Screening"
  return "Applied"
}

function cvSummary(candidate: Candidate) {
  if (candidate.status === "Applied") return "Waiting for AI..."
  const skills = candidate.matchedSkills.slice(0, 3).join(", ")
  const missing = candidate.missingSkills[0] ? ` Missing: ${candidate.missingSkills[0]}.` : ""
  return `${candidate.yearsExperience} years experience. Matches: ${skills || "under review"}.${missing}`
}

function mapBackendLeaderboardRow(row: BackendLeaderboardRow, index: number): Candidate {
  const candidate = row.candidate
  const score = row.score?.score ?? Math.max(55, 82 - index * 8)
  const scoreBreakdown = row.score?.score_breakdown ?? {}
  const matchedSkills = Object.keys(scoreBreakdown).length > 0 ? Object.keys(scoreBreakdown) : ["CV under review"]
  return {
    id: candidate.id,
    name: candidate.full_name,
    email: candidate.email,
    position: "Customer Support Specialist",
    source: "Website",
    cvScore: Math.round(score),
    testScore: 0,
    interviewScore: 0,
    totalScore: Math.round(score),
    matchedSkills,
    missingSkills: row.score?.badge === "GAP" ? ["Needs stronger role evidence"] : [],
    status: toCandidateStatus(candidate.status),
    progress: row.score ? 70 : 35,
    yearsExperience: 0,
    salaryExpectation: undefined,
    aiRecommendation: row.score?.badge === "STRONG" ? "Recommended for shortlist." : "Needs HR review.",
    strengths: matchedSkills.map(s => ({ trait: s, evidence: "Generated from backend scores." })),
    weaknesses: row.score?.badge === "GAP" ? [{ trait: "Needs stronger role evidence", evidence: "Backend indicated a GAP." }] : [],
    riskFlags: row.score?.risk_flags ?? [],
    reasoning: row.score?.ai_reasoning ? [row.score.ai_reasoning] : [candidate.cv_text ?? "CV text is pending extraction."],
  }
}

function optionText(option: Record<string, unknown>, index: number) {
  return String(option.text ?? option.label ?? option.value ?? option.id ?? `Option ${index + 1}`)
}

function optionId(option: Record<string, unknown>, index: number) {
  return String(option.id ?? option.value ?? option.label ?? `option-${index + 1}`)
}

function mapBackendTestQuestion(question: BackendTestQuestion): TestQuestion {
  const options = question.options.length > 0 ? question.options.map(optionText) : ["Option A", "Option B", "Option C", "Option D"]
  const correctIndex = question.options.findIndex((option, index) => optionId(option, index) === question.correct_option_id)
  return {
    id: question.id,
    question: question.question_text,
    options,
    correctAnswer: options[correctIndex >= 0 ? correctIndex : 0] ?? options[0] ?? "",
    difficulty: question.difficulty === "Hard" || question.difficulty === "Easy" ? question.difficulty : "Medium",
    relatedSkill: question.skill_tag ?? "Backend generated",
  }
}

function candidateStatusTone(status: CandidateStatus) {
  if (status === "Offer" || status === "Interview") return "green"
  if (status === "Rejected") return "red"
  if (status === "Test Sent") return "orange"
  return "blue"
}







export function TestReviewScreen({ onStatusChange }: { onStatusChange?: (saved: boolean) => void }) {
  const params = useParams<{ campaignId?: string, positionId?: string }>()
  const searchParams = useSearchParams()
  const campaignId = params?.campaignId ?? ""
  const positionId = params?.positionId ?? searchParams.get("positionId") ?? ""
  
  const [questions, setQuestions] = useState<BackendTestQuestion[]>([])
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiCount, setAiCount] = useState(15)
  const [saveMessage, setSaveMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    if (!positionId) return
    setLoading(true)
    listTestQuestions(positionId)
      .then((data) => {
        if (mounted) setQuestions(data)
      })
      .catch((err) => {
        if (mounted) setError(formatApiError(err, "Could not load test questions."))
        onStatusChange?.(false)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [positionId])

  const handleAiGenerate = async () => {
    if (!positionId) return
    setGenerating(true)
    setError("")
    try {
      const data = await generateTestQuestions(positionId, aiCount)
      setQuestions(data)
    } catch (err) {
      setError(formatApiError(err, "Generation failed."))
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!positionId) return
    setSaving(true)
    setSaveMessage("")
    try {
      const saved = await saveTestQuestions(positionId, questions)
      setQuestions(saved)
      setSaveMessage("Saved successfully to backend.")
      onStatusChange?.(true)
    } catch (err) {
      setError(formatApiError(err, "Failed to save test questions."))
      onStatusChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  const updateQuestion = (id: string, updates: Partial<BackendTestQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleAddEmptyQuestion = () => {
    const newQ = {
      id: `new-${Date.now()}`,
      question_text: "",
      options: [{ id: "o1", text: "" }, { id: "o2", text: "" }, { id: "o3", text: "" }, { id: "o4", text: "" }],
      correct_option_id: "o1",
      difficulty: "Medium",
      skill_tag: "General"
    } as unknown as BackendTestQuestion
    setQuestions([newQ, ...questions])
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Review & AI Generation</h2>
        <p className="text-sm text-muted-foreground">Review test questions or generate new ones using AI.</p>
      </div>
      
      {error && <div className="text-red-500 font-medium text-sm">{error}</div>}
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="font-semibold" onClick={() => setViewMode("preview")}>
            Preview Mode
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setViewMode("edit")}>
            Edit Mode
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="number" 
            min="5" 
            max="30" 
            value={aiCount} 
            onChange={(e) => setAiCount(parseInt(e.target.value) || 15)}
            className="w-20 h-9"
          />
          <Button className="bg-[#102a62] text-white hover:bg-[#0b1d45]" onClick={handleAiGenerate} disabled={generating}>
            {generating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Auto-Generate
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-slate-50 text-slate-500">
            No test questions yet. Use AI to generate them or add manually.
          </div>
        ) : viewMode === "edit" ? (
          questions.map((q, idx) => (
            <Card key={q.id || idx} className="p-4 relative group">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                onClick={() => handleDeleteQuestion(q.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="font-bold text-lg text-slate-400 mt-1">{idx + 1}.</span>
                  <div className="flex-1 space-y-3">
                    <Textarea 
                      value={q.question_text} 
                      onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                      className="font-medium bg-slate-50"
                      placeholder="Question text..."
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      {q.options.map((opt: any) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name={`correct-${q.id}`}
                            checked={q.correct_option_id === opt.id}
                            onChange={() => updateQuestion(q.id, { correct_option_id: opt.id })}
                            className="w-4 h-4 text-[#f37021] focus:ring-[#f37021]"
                          />
                          <Input 
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = q.options.map((o: any) => o.id === opt.id ? { ...o, text: e.target.value } : o)
                              updateQuestion(q.id, { options: newOptions })
                            }}
                            className={q.correct_option_id === opt.id ? "border-[#f37021] bg-orange-50" : ""}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id || idx} className="p-5 border-l-4 border-l-[#102a62]">
              <div className="flex gap-4">
                <span className="font-bold text-lg text-slate-400">{idx + 1}.</span>
                <div className="flex-1 space-y-4">
                  <h4 className="font-medium text-slate-900">{q.question_text}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map((opt: any) => (
                      <div 
                        key={opt.id} 
                        className={`p-3 rounded-md border text-sm ${
                          q.correct_option_id === opt.id 
                            ? "bg-green-50 border-green-200 text-green-900 font-medium" 
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={handleAddEmptyQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question Manually
        </Button>
        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm text-green-600 font-medium">{saveMessage}</span>}
          <Button variant="outline" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Questions"}
          </Button>
          <Button 
            className="bg-[#0033A0] text-white hover:bg-[#00256f]" 
            onClick={async () => {
              if (!positionId) return
              try {
                const { publishPosition } = await import("@/features/hr/api/hr-api")
                await publishPosition(positionId)
                alert("Position published successfully!")
              } catch (err) {
                alert("Failed to publish position.")
              }
            }}
          >
            Publish Position
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CandidateDrawer({
  candidate,
  onClose,
  onActionComplete,
}: {
  candidate: Candidate | null
  onClose: () => void
  onActionComplete?: () => Promise<void> | void
}) {
  const searchParams = useSearchParams()
  const positionId =
    searchParams.get("positionId") ||
    (typeof window !== "undefined" ? window.localStorage.getItem("activePositionId") : "") ||
    ""
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)

  const runAction = async (actionName: string, action: () => Promise<string>) => {
    setBusyAction(actionName)
    setActionMessage(null)
    try {
      const text = await action()
      await onActionComplete?.()
      setActionMessage({ type: "success", text })
    } catch (error) {
      setActionMessage({ type: "error", text: formatApiError(error, `${actionName} failed.`) })
    } finally {
      setBusyAction(null)
    }
  }

  const requirePositionId = () => {
    if (!positionId) throw new Error("Missing position_id. Open this candidate from a position leaderboard route.")
    return positionId
  }

  return (
    <Sheet open={Boolean(candidate)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {candidate ? (
          <>
            <SheetHeader className="relative pr-8 border-b pb-4 mb-4">
              <SheetTitle className="text-xl">{candidate.name}</SheetTitle>
              <SheetDescription>{candidate.email}</SheetDescription>
              {candidate.riskFlags.length > 0 && (
                <div className="absolute top-0 right-0 max-w-[200px] bg-red-50 text-red-700 p-2 rounded-lg border border-red-100 flex items-start gap-2 shadow-sm animate-in slide-in-from-right-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                  <div className="text-xs font-medium leading-tight">
                    {candidate.riskFlags.map((flag, idx) => (
                      <div key={idx} className="mb-1 last:mb-0">{flag}</div>
                    ))}
                  </div>
                </div>
              )}
            </SheetHeader>
            <div className="space-y-6 px-4 pb-20">
              {actionMessage ? <FormMessage type={actionMessage.type}>{actionMessage.text}</FormMessage> : null}
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">Điểm mạnh (Strengths)</h3>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Skill Match</Badge>
                  </div>
                  <ul className="space-y-3">
                    {candidate.strengths.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        <div className="font-semibold text-slate-800 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          {item.trait}
                        </div>
                        <div className="text-slate-500 italic ml-6 mt-0.5 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">
                          "{item.evidence}"
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">Điểm yếu (Weaknesses)</h3>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Domain Gap</Badge>
                  </div>
                  <ul className="space-y-3">
                    {candidate.weaknesses.map((item, idx) => (
                      <li key={idx} className="text-sm">
                        <div className="font-semibold text-slate-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          {item.trait}
                        </div>
                        <div className="text-slate-500 italic ml-6 mt-0.5 leading-relaxed bg-slate-50 p-2 rounded-md border border-slate-100">
                          "{item.evidence}"
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Nhận định tổng quan (AI Reasoning)
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {candidate.reasoning.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">Mức độ phù hợp (%)</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-slate-400 hover:text-slate-700"
                    disabled={Boolean(busyAction)}
                    onClick={() =>
                      runAction("Score CV", async () => {
                        const activePositionId = requirePositionId()
                        await scorePositionCandidates(activePositionId, candidate.id)
                        return "Yêu cầu chấm điểm lại CV đã được gửi."
                      })
                    }
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", busyAction === "Score CV" && "animate-spin")} />
                    {busyAction === "Score CV" ? "Đang xử lý..." : "Re-score"}
                  </Button>
                </div>
                <ScoreBar label="CV Score" value={candidate.cvScore} />
                <ScoreBar label="Test Score" value={candidate.testScore} />
                <ScoreBar label="Interview Score" value={candidate.interviewScore} />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 px-6 flex items-center justify-between z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
              <Button
                variant="ghost"
                className="text-red-500 hover:bg-red-50 hover:text-red-600 text-sm font-medium transition-colors"
                disabled={Boolean(busyAction)}
                onClick={() => runAction("Final reject", async () => {
                  await finalDecision(candidate.id, "REJECTED", "Loại từ màn hình chi tiết.")
                  return "Đã chuyển ứng viên vào nhóm Loại."
                })}
              >
                Từ chối
              </Button>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={onClose} className="border-slate-200">
                  Đóng
                </Button>
                
                {/* Custom Split Button equivalent */}
                <div className="relative group">
                  <Button
                    className="bg-[#0033A0] text-white hover:bg-[#00256f] flex items-center gap-2 pr-2"
                    disabled={Boolean(busyAction)}
                    onClick={() =>
                      runAction("Invite interview", async () => {
                        const link = await inviteCandidateToInterview(candidate.id)
                        return `Đã mời phỏng vấn. Link: ${link.url}`
                      })
                    }
                  >
                    {busyAction === "Invite interview" ? "Đang xử lý..." : "Chuyển vòng kế tiếp"}
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  
                  {/* Dropdown Menu on Hover */}
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all origin-bottom-right z-50 p-1">
                    <button 
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center gap-2 font-medium"
                      onClick={() =>
                        runAction("Invite test", async () => {
                          const link = await inviteCandidateToTest(candidate.id)
                          return `Đã gửi bài Test. Link: ${link.url}`
                        })
                      }
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      Gửi bài Test
                    </button>
                    <button 
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center gap-2 font-medium"
                      onClick={() => runAction("Final pass", async () => {
                        await finalDecision(candidate.id, "PASSED", "Đạt yêu cầu từ màn hình chi tiết.")
                        return "Đã đánh dấu Đạt Yêu Cầu."
                      })}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Chốt Đạt Yêu Cầu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function CandidateRankingTable({
  candidates,
  onViewMore,
  onQuickAction,
  busyAction,
}: {
  candidates: Candidate[]
  onViewMore: (candidate: Candidate) => void
  onQuickAction?: (candidate: Candidate, actionName: string, actionFn: () => Promise<string>) => void
  busyAction?: string | null
}) {
  const [activeTab, setActiveTab] = useState("to-review")
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  if (candidates.length === 0) {
    return <EmptyState title="No candidates" description="Candidates will appear here after CV submission or backend scoring." />
  }

  // Phân luồng Tab
  const toReview = candidates.filter(c => (c.totalScore >= 60 && (c.status === "Applied" || c.status === "CV Screening" || c.status === "Test Sent")))
  const inProgress = candidates.filter(c => c.status === "Interview" || c.status === "Offer")
  const disqualified = candidates.filter(c => c.totalScore < 60 || c.status === "Rejected")

  const currentList = activeTab === "to-review" ? toReview : activeTab === "in-progress" ? inProgress : disqualified

  const toggleSelectAll = () => {
    if (selectedIds.length === currentList.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(currentList.map(c => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const renderScoreBreakdown = (c: Candidate) => {
    const bd = c.score_breakdown
    if (!bd) {
      return (
        <span className="rounded-md bg-[#0033A0]/10 px-2 py-1 text-sm font-bold text-[#0033A0]">
          {c.totalScore}
        </span>
      )
    }

    const hardPerc = (bd.hard_skills.score / c.totalScore) * 100 || 0
    const softPerc = (bd.soft_skills.score / c.totalScore) * 100 || 0
    const expPerc = (bd.experience.score / c.totalScore) * 100 || 0

    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-pointer">
            <span className={cn("rounded-md px-2 py-1 text-sm font-bold", 
              c.totalScore >= 80 ? "bg-emerald-100 text-emerald-800" : 
              c.totalScore >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800")}>
              {c.totalScore} / 100
            </span>
            <div className="w-full flex h-1.5 rounded-full overflow-hidden mt-1.5 bg-slate-100">
              <div className="bg-emerald-500" style={{ width: `${hardPerc}%` }} />
              <div className="bg-blue-500" style={{ width: `${softPerc}%` }} />
              <div className="bg-orange-500" style={{ width: `${expPerc}%` }} />
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4 shadow-xl z-50">
          <h4 className="font-bold text-slate-900 mb-3 text-sm">Chi tiết mức độ phù hợp</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Hard Skills</span>
                <span className="font-bold">{bd.hard_skills.score}/{bd.hard_skills.max}</span>
              </div>
              <p className="text-xs text-slate-500">{bd.hard_skills.reason}</p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"/> Soft Skills</span>
                <span className="font-bold">{bd.soft_skills.score}/{bd.soft_skills.max}</span>
              </div>
              <p className="text-xs text-slate-500">{bd.soft_skills.reason}</p>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"/> Experience</span>
                <span className="font-bold">{bd.experience.score}/{bd.experience.max}</span>
              </div>
              <p className="text-xs text-slate-500">{bd.experience.reason}</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    )
  }

  const requireActivePositionId = () => {
    if (typeof window === "undefined") throw new Error("Missing position_id.")
    const activePositionId = window.localStorage.getItem("activePositionId") || ""
    if (!activePositionId) throw new Error("Missing position_id. Open this table from a position pipeline route.")
    return activePositionId
  }

  const runQuickAction = (
    event: MouseEvent<HTMLButtonElement>,
    candidate: Candidate,
    actionName: string,
    actionFn: () => Promise<string>,
  ) => {
    event.stopPropagation()
    onQuickAction?.(candidate, actionName, actionFn)
  }

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds([]); }} className="w-auto">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="to-review" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Chờ duyệt <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">{toReview.length}</Badge></TabsTrigger>
            <TabsTrigger value="in-progress" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">Đang xử lý <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">{inProgress.length}</Badge></TabsTrigger>
            <TabsTrigger value="disqualified" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-500">Loại <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-500">{disqualified.length}</Badge></TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search candidates..." className="pl-8 h-9 w-[200px] text-sm bg-slate-50" />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1 text-slate-600"><Filter className="w-3.5 h-3.5" /> Filters</Button>
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
            <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded transition-all", viewMode === "list" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("kanban")} className={cn("p-1.5 rounded transition-all", viewMode === "kanban" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}><LayoutGrid className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox checked={currentList.length > 0 && selectedIds.length === currentList.length} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="w-[200px]">Candidate</TableHead>
                  <TableHead className="min-w-[300px]">Đánh giá Năng lực</TableHead>
                  <TableHead className="w-[140px]">Mức độ phù hợp (%)</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[260px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Không có ứng viên nào trong danh sách này.</TableCell></TableRow>
                ) : (
                  currentList.sort((a, b) => b.totalScore - a.totalScore).map((candidate) => (
                    <TableRow key={candidate.id} className={cn("transition-colors hover:bg-slate-50/80 cursor-pointer", selectedIds.includes(candidate.id) && "bg-blue-50/50 hover:bg-blue-50")}>
                      <TableCell className="text-center">
                        <Checkbox checked={selectedIds.includes(candidate.id)} onCheckedChange={() => toggleSelect(candidate.id)} />
                      </TableCell>
                      <TableCell onClick={() => onViewMore(candidate)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs uppercase">
                            {candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{candidate.yearsExperience} năm K/N</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={() => onViewMore(candidate)}>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.matchedSkills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {skill}
                            </Badge>
                          ))}
                          {candidate.matchedSkills.length > 3 && (
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-medium">
                              +{candidate.matchedSkills.length - 3} more
                            </Badge>
                          )}
                          {candidate.missingSkills.map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-medium whitespace-nowrap">
                              <AlertCircle className="w-3 h-3 mr-1" /> {skill}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{renderScoreBreakdown(candidate)}</TableCell>
                      <TableCell>
                        <StatusPill tone={candidateStatusTone(candidate.status)}>{candidate.status}</StatusPill>
                        {candidate.action_recommendation === "auto_shortlist" && (
                          <div className="mt-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3"/> Đạt Yêu Cầu</div>
                        )}
                        {candidate.action_recommendation === "auto_reject" && (
                          <div className="mt-1 text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-3 h-3"/> AI Từ chối</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {onQuickAction ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Score CV"
                                disabled={Boolean(busyAction)}
                                onClick={(event) =>
                                  runQuickAction(event, candidate, "Score CV", async () => {
                                    const activePositionId = requireActivePositionId()
                                    await scorePositionCandidates(activePositionId, candidate.id)
                                    return "CV score updated from backend."
                                  })
                                }
                              >
                                <RefreshCw className={cn("h-3.5 w-3.5", busyAction === "Score CV" && "animate-spin")} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Invite test"
                                disabled={Boolean(busyAction)}
                                onClick={(event) =>
                                  runQuickAction(event, candidate, "Invite test", async () => {
                                    const link = await inviteCandidateToTest(candidate.id)
                                    return `Test invitation: ${link.url}`
                                  })
                                }
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Invite interview"
                                disabled={Boolean(busyAction)}
                                onClick={(event) =>
                                  runQuickAction(event, candidate, "Invite interview", async () => {
                                    const link = await inviteCandidateToInterview(candidate.id)
                                    return `Interview invitation: ${link.url}`
                                  })
                                }
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Pass candidate"
                                className="text-emerald-700 hover:text-emerald-800"
                                disabled={Boolean(busyAction)}
                                onClick={(event) =>
                                  runQuickAction(event, candidate, "Final pass", async () => {
                                    await finalDecision(candidate.id, "PASSED", "Marked from HR pipeline quick action.")
                                    return "Candidate marked as passed."
                                  })
                                }
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Reject candidate"
                                className="text-red-700 hover:text-red-800"
                                disabled={Boolean(busyAction)}
                                onClick={(event) =>
                                  runQuickAction(event, candidate, "Final reject", async () => {
                                    await finalDecision(candidate.id, "REJECTED", "Marked from HR pipeline quick action.")
                                    return "Candidate rejected."
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : null}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onViewMore(candidate); }}>Detail</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 bg-slate-50">
            <LayoutGrid className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="font-semibold text-lg text-slate-700">Kanban Board View</p>
            <p className="text-sm mt-2 max-w-md mx-auto">Chế độ xem bảng Kanban đang được xây dựng. Vui lòng sử dụng Data Table để thao tác hàng loạt.</p>
            <Button className="mt-4" variant="outline" onClick={() => setViewMode("list")}>Quay lại Data Table</Button>
          </div>
        )}

        {/* Floating Action Bar */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 z-50">
            <span className="text-sm font-semibold bg-slate-800 px-3 py-1 rounded-full">{selectedIds.length} đã chọn</span>
            <div className="w-px h-5 bg-slate-700" />
            <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 gap-2 font-semibold">
              <Mail className="w-4 h-4" /> Gửi bài Test
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800 gap-2 font-semibold">
              <RefreshCw className="w-4 h-4" /> Đổi trạng thái
            </Button>
            <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-slate-800 gap-2 font-semibold">
              <Trash2 className="w-4 h-4" /> Từ chối
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}





export function InterviewReportScreen() {
  const params = useParams<{ campaignId?: string }>()
  const searchParams = useSearchParams()
  const campaignId = params?.campaignId || getRememberedCampaignId()
  const positionId = searchParams.get("positionId") || window.localStorage.getItem("activePositionId") || ""
  const candidate = candidates[0]

  return (
    <>
      <PageHeader title='Virtual Interview Report' subtitle='Transcript, competency radar chart, summary, recommendation, and evidence.' />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{candidate.name}</h2>
            <p className="text-sm text-muted-foreground">{candidate.position}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export Report</Button>
            <Link href={campaignId && positionId ? `/hr/campaigns/${campaignId}/leaderboard?positionId=${positionId}` : "/hr"}>
              <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]">Back to Candidate</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <Card className="rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-foreground">Interview transcript</h3>
            <div className="mt-4 space-y-3">
              {interviewTranscript.map((line) => (
                <div key={`${line.speaker}-${line.time}`} className="rounded-lg border bg-white p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0033A0]">{line.speaker}</span>
                    <span className="text-xs text-muted-foreground">{line.time}</span>
                  </div>
                  <p className="text-sm text-foreground">{line.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-foreground">Competency radar</h3>
            <div className="mt-3 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <Radar dataKey="score" stroke="#0033A0" fill="#0033A0" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-lg p-4 shadow-sm lg:col-span-2">
            <h3 className="font-semibold text-foreground">AI summary</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Candidate communicates clearly, grounds technical decisions in product constraints, and can explain dashboard
              performance work with measurable outcomes. The main follow-up area is deeper GraphQL ownership.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {candidate.reasoning.map((reason) => (
                <div key={reason} className="rounded-lg bg-slate-50 p-3 text-sm text-muted-foreground">
                  {reason}
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-lg border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <h3 className="font-semibold text-emerald-800">Recommendation</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-700">Pass</p>
            <ul className="mt-4 space-y-2 text-sm text-emerald-800">
              <li>- Strong technical evidence</li>
              <li>- Clear communication under follow-up questions</li>
              <li>- Matches top rubric priorities</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
