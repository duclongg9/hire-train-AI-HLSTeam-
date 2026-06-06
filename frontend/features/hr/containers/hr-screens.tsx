"use client"
import { PageHeader } from "@/shared/layout/page-header"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  ClipboardCheck,
  Edit3,
  FileText,
  Filter,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
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
  publishTestQuestions,
  finalDecision,
  inviteCandidateToInterview,
  inviteCandidateToTest,
  scoreCampaignCandidates,
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
    strengths: matchedSkills,
    weaknesses: row.score?.badge === "GAP" ? ["Some required evidence is missing."] : [],
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

export function HrDashboardScreen() {
  const [dashboardCandidates, setDashboardCandidates] = useState<Candidate[]>(candidates)
  const [activeCampaignCount, setActiveCampaignCount] = useState(campaigns.length)
  const [activeCampaign, setActiveCampaign] = useState<BackendCampaign | null>(null)
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [jdMessage, setJdMessage] = useState("")
  const [healthMessage, setHealthMessage] = useState("")
  const [jdError, setJdError] = useState("")
  const [showJdError, setShowJdError] = useState(false)
  const [analyzingJd, setAnalyzingJd] = useState(false)
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    let mounted = true
    healthCheck()
      .then((health) => {
        if (mounted) setHealthMessage(`Backend health: ${health.status} (${health.storage_provider}, AI: ${health.ai_provider}).`)
      })
      .catch((error) => {
        if (mounted) setHealthMessage(formatApiError(error, "Backend health check failed."))
      })
    listCampaigns()
      .then(async (backendCampaigns) => {
        if (!mounted || backendCampaigns.length === 0) {
          if (mounted) setJdMessage("No backend campaigns yet. Create a campaign to start the live flow.")
          return
        }
        setActiveCampaignCount(backendCampaigns.filter((campaign) => campaign.status === "ACTIVE").length || backendCampaigns.length)
        const activeCampaign = backendCampaigns.find((campaign) => campaign.status === "ACTIVE") ?? backendCampaigns[0]
        setActiveCampaign(activeCampaign)
        rememberActiveCampaign(activeCampaign.id)
        const rows = await listLeaderboard(activeCampaign.id)
        if (mounted && rows.length > 0) {
          setDashboardCandidates(rows.map(mapBackendLeaderboardRow))
        }
      })
      .catch((error) => {
        if (mounted) setJdMessage(`${formatApiError(error)} Using local demo data until the backend is running.`)
      })
    return () => {
      mounted = false
    }
  }, [])

  const analyzeJd = async () => {
    setJdMessage("")
    setJdError("")
    setShowJdError(false)
    if (!jdFile) {
      setJdError("Choose a JD file before running analysis.")
      return
    }
    if (!activeCampaign?.id) {
      setJdError("Create or select a backend campaign before analyzing a JD.")
      return
    }
    const lowerName = jdFile.name.toLowerCase()
    const validFormat = [".pdf", ".doc", ".docx"].some((extension) => lowerName.endsWith(extension))
    if (!validFormat) {
      setJdError("Unsupported JD file format.")
      setShowJdError(true)
      return
    }
    if (lowerName.includes("scanned") || lowerName.includes("short")) {
      setJdError(lowerName.includes("scanned") ? "Scanned PDF image detected." : "JD content is too short.")
      setShowJdError(true)
      return
    }
    setAnalyzingJd(true)
    try {
      const rubric = await extractRubricFromJdFile(activeCampaign.id, jdFile)
      setJdMessage(`JD analyzed and ${rubric.length} rubric criteria were saved for ${activeCampaign.title}.`)
      rememberActiveCampaign(activeCampaign.id)
    } catch (error) {
      setJdError(formatApiError(error, "JD analysis failed."))
      setShowJdError(true)
    } finally {
      setAnalyzingJd(false)
    }
  }

  return (
    <>
      <PageHeader title="HR Recruitment Dashboard" subtitle="Single workspace for JD analysis, candidate ranking, and hiring pipeline." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Candidates" value={dashboardCandidates.length} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Active Campaigns" value={activeCampaignCount} icon={<FileText className="h-5 w-5" />} tone="orange" />
          <StatCard label="CV Scored" value={dashboardCandidates.filter((candidate) => candidate.cvScore > 0).length} icon={<ClipboardCheck className="h-5 w-5" />} tone="green" />
          <StatCard label="In Interview" value={dashboardCandidates.filter((candidate) => candidate.status === "Interview").length} icon={<BarChart3 className="h-5 w-5" />} tone="slate" />
        </div>

        {healthMessage ? <FormMessage type={healthMessage.startsWith("Backend health: ok") ? "success" : "warning"}>{healthMessage}</FormMessage> : null}
        {jdMessage ? <FormMessage type={jdMessage.startsWith("Using") ? "warning" : "success"}>{jdMessage}</FormMessage> : null}
        {jdError && !showJdError ? <FormMessage type="error">{jdError}</FormMessage> : null}

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <Card className="rounded-lg p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="font-semibold text-foreground">JD analysis</h2>
              <p className="text-sm text-muted-foreground">
                {activeCampaign ? `Active campaign: ${activeCampaign.title}` : "Upload and validate the JD after creating a backend campaign."}
              </p>
            </div>
            <UploadPanel
              title="Upload JD file"
              description="PDF, DOC, or DOCX. File names containing scanned or short trigger backend-aligned validation states."
              accept=".pdf,.doc,.docx"
              fileName={jdFile?.name}
              onChange={setJdFile}
            />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={analyzingJd || !activeCampaign} onClick={analyzeJd}>
                {analyzingJd ? "Analyzing..." : "Analyze JD"}
              </Button>
              <Link href={activeCampaign ? `/hr/campaigns/${activeCampaign.id}/rubric` : "/hr/campaigns/new"}>
                <Button variant="outline">Review Rubric</Button>
              </Link>
            </div>
          </Card>

          <Card className="rounded-lg p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Candidate ranking</h2>
                <p className="text-sm text-muted-foreground">CV summary is shown in-table. Open details for the full CV review.</p>
              </div>
              <Link href="/hr/campaigns/new">
                <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
            </div>
            <CandidateRankingTable candidates={dashboardCandidates} onViewMore={setDrawerCandidate} />
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="rounded-lg p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-foreground">Recruitment pipeline</h2>
                <p className="text-sm text-muted-foreground">Candidate movement across the backend recruitment stages.</p>
              </div>
            </div>
            <div className="grid gap-3 overflow-x-auto lg:grid-cols-6">
              {pipelineStages.map((stage) => {
                const stageCandidates = dashboardCandidates.filter((candidate) => candidate.status === stage)
                return (
                  <div key={stage} className="min-w-60 rounded-lg border bg-slate-50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{stage}</p>
                      <span className="rounded-md bg-white px-2 py-1 text-xs text-muted-foreground">{stageCandidates.length}</span>
                    </div>
                    <div className="space-y-3">
                      {stageCandidates.length === 0 ? (
                        <div className="rounded-lg border border-dashed bg-white p-3 text-xs text-muted-foreground">No candidate</div>
                      ) : (
                        stageCandidates.map((candidate) => (
                          <div key={candidate.id} className="rounded-lg border bg-white p-3 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{candidate.name}</p>
                                <p className="text-xs text-muted-foreground">{candidate.position}</p>
                              </div>
                              <span className="rounded-md bg-[#0033A0]/10 px-2 py-1 text-xs font-semibold text-[#0033A0]">
                                {candidate.totalScore}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {candidate.matchedSkills.slice(0, 2).map((skill) => (
                                <StatusPill key={skill} tone="slate">
                                  {skill}
                                </StatusPill>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold text-foreground">CV source mix</h2>
            <p className="text-sm text-muted-foreground">Sourcing distribution for the active campaign.</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={4}>
                    {sourceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {sourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.fill }} />
                    {source.name}
                  </span>
                  <span className="font-semibold text-foreground">{source.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <CandidateDrawer candidate={drawerCandidate} onClose={() => setDrawerCandidate(null)} />
      <JdErrorModal
        open={showJdError}
        error={jdError}
        onUploadAgain={() => {
          setJdFile(null)
          setShowJdError(false)
        }}
        onCancel={() => setShowJdError(false)}
      />
    </>
  )
}

export function CreateCampaignScreen() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "Q3 Frontend Hiring", jobTitle: "Senior Frontend Engineer", startDate: "2026-06-01", endDate: "2026-07-15", department: "", description: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const saveCampaign = async (status: "DRAFT" | "ACTIVE") => {
    setError("")
    setSuccess(false)
    if (!form.name || !form.jobTitle || !form.startDate || !form.endDate || !form.department) {
      setError("Missing required campaign fields.")
      return
    }

    setLoading(true)
    try {
      const created = await createCampaign({
        title: `${form.name} - ${form.jobTitle}`,
        jd_text: form.description || null,
        start_date: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : null,
        deadline_at: form.endDate ? new Date(`${form.endDate}T23:59:59`).toISOString() : null,
        department_scope: form.department,
        status: status,
      })
      rememberActiveCampaign(created.id)
      setSuccess(true)
      window.setTimeout(() => router.push(`/hr/campaigns/${created.id}/rubric`), 450)
    } catch (error) {
      setError(formatApiError(error, "Campaign could not be created."))
    }
    setLoading(false)
  }

  return (
    <>
      <PageHeader title="Create Campaign" subtitle="Create campaign metadata. JD upload and analysis live on the HR dashboard." />
      <div className="mx-auto max-w-4xl space-y-6">
        {error ? <FormMessage type="warning">{error}</FormMessage> : null}
        {success ? <FormMessage type="success">Campaign created. Returning to the HR dashboard for JD analysis.</FormMessage> : null}

        <Card className="rounded-lg p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input id="campaign-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input id="job-title" value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="department">Department</Label>
              <Select value={form.department} onValueChange={(value) => setForm({ ...form, department: value })}>
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Khối CNTT">Khối CNTT</SelectItem>
                  <SelectItem value="Khối Khách hàng Cá nhân">Khối Khách hàng Cá nhân</SelectItem>
                  <SelectItem value="Khối Vận hành">Khối Vận hành</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description optional</Label>
              <Textarea id="description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} />
            </div>
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/hr">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button variant="outline" className="border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100" disabled={loading} onClick={() => saveCampaign("DRAFT")}>
            Lưu Nháp (Draft)
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={loading} onClick={() => saveCampaign("ACTIVE")}>
            {loading ? "Creating..." : "Tạo & Kích Hoạt (Active)"}
          </Button>
        </div>
      </div>
    </>
  )
}

export function RubricScreen() {
  const router = useRouter()
  const campaignId = useRouteCampaignId() || getRememberedCampaignId()
  const [skills, setSkills] = useState<RubricSkill[]>(extractedSkills)
  const [saving, setSaving] = useState(false)
  const total = skills.reduce((sum, skill) => sum + skill.weight, 0)

  const updateWeight = (skillId: string, weight: number) => {
    setSkills((current) => current.map((skill) => (skill.id === skillId ? { ...skill, weight } : skill)))
  }

  const save = () => {
    if (total !== 100) return
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      router.push(`/hr/campaigns/${campaignId}/test-review`)
    }, 600)
  }

  return (
    <>
      <PageHeader title="Rubric Configuration" subtitle="Review AI extracted skills and tune scoring weights before test generation." />
      <div className="space-y-6">
        <Card className="rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Extracted JD skills</h2>
              <p className="text-sm text-muted-foreground">Each skill is editable through a weight slider.</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total weight</p>
              <p className={cn("text-2xl font-bold", total === 100 ? "text-emerald-700" : "text-orange-700")}>{total}%</p>
            </div>
          </div>
          {total !== 100 ? (
            <div className="mt-4">
              <FormMessage type="warning">Total weight must equal 100% before saving.</FormMessage>
            </div>
          ) : null}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-lg border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{skill.name}</h3>
                      <StatusPill tone="blue">{skill.category}</StatusPill>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{skill.evidence}</p>
                  </div>
                  <span className="text-lg font-bold text-[#0033A0]">{skill.weight}%</span>
                </div>
                <Slider className="mt-4" min={0} max={60} step={5} value={[skill.weight]} onValueChange={(value) => updateWeight(skill.id, value[0] ?? 0)} />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setSkills(extractedSkills.map((skill, index) => ({ ...skill, weight: [30, 20, 15, 15, 20][index] ?? skill.weight })))}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Rubric
          </Button>
          <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" disabled={total !== 100 || saving} onClick={save}>
            {saving ? "Saving..." : "Save Rubric"}
          </Button>
        </div>
      </div>
    </>
  )
}

export function TestReviewScreen() {
  const router = useRouter()
  const campaignId = useRouteCampaignId() || getRememberedCampaignId()
  const [questions, setQuestions] = useState<TestQuestion[]>(testQuestions)
  const [editing, setEditing] = useState<TestQuestion | null>(null)
  const [open, setOpen] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)
  const [draft, setDraft] = useState({
    question: "",
    options: "",
    correctAnswer: "",
    difficulty: "Medium" as TestQuestion["difficulty"],
    relatedSkill: "React architecture",
  })

  useEffect(() => {
    if (!campaignId) {
      setMessage({ type: "warning", text: "Open Test Review from a backend campaign to load generated questions." })
      return
    }

    let mounted = true
    setLoadingQuestions(true)
    rememberActiveCampaign(campaignId)
    listTestQuestions(campaignId)
      .then((backendQuestions) => {
        if (!mounted) return
        if (backendQuestions.length > 0) {
          setQuestions(backendQuestions.map(mapBackendTestQuestion))
          setMessage({ type: "success", text: `Loaded ${backendQuestions.length} backend test questions.` })
        } else {
          setMessage({ type: "warning", text: "No backend test questions yet. Generate them from the saved rubric." })
        }
      })
      .catch((error) => {
        if (mounted) setMessage({ type: "error", text: formatApiError(error, "Could not load test questions.") })
      })
      .finally(() => {
        if (mounted) setLoadingQuestions(false)
      })

    return () => {
      mounted = false
    }
  }, [campaignId])

  const openEditor = (question?: TestQuestion) => {
    setEditing(question ?? null)
    setDraft(
      question
        ? { ...question, options: question.options.join("\n") }
        : { question: "", options: "Option A\nOption B\nOption C\nOption D", correctAnswer: "", difficulty: "Medium", relatedSkill: "React architecture" },
    )
    setOpen(true)
  }

  const saveQuestion = () => {
    const options = draft.options.split("\n").map((option) => option.trim()).filter(Boolean).slice(0, 4)
    const nextQuestion: TestQuestion = {
      id: editing?.id ?? `q-${Date.now()}`,
      question: draft.question,
      options,
      correctAnswer: draft.correctAnswer || options[0] || "",
      difficulty: draft.difficulty,
      relatedSkill: draft.relatedSkill,
    }
    setQuestions((current) => (editing ? current.map((question) => (question.id === editing.id ? nextQuestion : question)) : [nextQuestion, ...current]))
    setOpen(false)
  }

  const generate = async () => {
    if (!campaignId) {
      setMessage({ type: "error", text: "Missing campaign_id in the route." })
      return
    }
    setGenerating(true)
    setMessage(null)
    try {
      const generated = await generateTestQuestions(campaignId, 15)
      setQuestions(generated.map(mapBackendTestQuestion))
      setMessage({ type: "success", text: `Generated ${generated.length} questions from backend.` })
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Could not generate test questions.") })
    } finally {
      setGenerating(false)
    }
  }

  const publish = async () => {
    if (!campaignId) {
      setMessage({ type: "error", text: "Missing campaign_id in the route." })
      return
    }
    setPublishing(true)
    setMessage(null)
    try {
      await publishTestQuestions(campaignId)
      setMessage({ type: "success", text: "Test questions published. Moving to leaderboard." })
      setPublishing(false)
      router.push(`/hr/campaigns/${campaignId}/leaderboard`)
    } catch (error) {
      setMessage({ type: "error", text: formatApiError(error, "Could not publish test questions.") })
      setPublishing(false)
    }
  }

  return (
    <>
      <PageHeader title="Test Review" subtitle="Review AI generated multiple-choice questions before publishing the candidate test." />
      <div className="space-y-6">
        {message ? <FormMessage type={message.type}>{message.text}</FormMessage> : null}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {loadingQuestions ? "Loading backend questions..." : `${questions.length} questions ready for HR review.`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={generating || publishing} onClick={generate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {generating ? "Generating..." : "Generate"}
            </Button>
            <Button variant="outline" onClick={() => openEditor()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
            <Button className="bg-[#F37021] text-white hover:bg-[#d95f18]" disabled={publishing} onClick={publish}>
              <Send className="mr-2 h-4 w-4" />
              {publishing ? "Publishing..." : "Publish Test"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="rounded-lg p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[#0033A0]/10 px-2 py-1 text-xs font-semibold text-[#0033A0]">Q{index + 1}</span>
                    <StatusPill tone={question.difficulty === "Hard" ? "red" : question.difficulty === "Medium" ? "orange" : "green"}>{question.difficulty}</StatusPill>
                    <StatusPill tone="slate">{question.relatedSkill}</StatusPill>
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{question.question}</h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {question.options.map((option) => (
                      <div key={option} className={cn("rounded-lg border p-3 text-sm", option === question.correctAnswer ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-white")}>
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditor(question)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-700" onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Question" : "Add Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question text</Label>
              <Textarea value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>4 options, one per line</Label>
              <Textarea value={draft.options} onChange={(event) => setDraft({ ...draft, options: event.target.value })} rows={4} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Correct answer</Label>
                <Input value={draft.correctAnswer} onChange={(event) => setDraft({ ...draft, correctAnswer: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={draft.difficulty} onValueChange={(value) => setDraft({ ...draft, difficulty: value as TestQuestion["difficulty"] })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Related skill</Label>
                <Input value={draft.relatedSkill} onChange={(event) => setDraft({ ...draft, relatedSkill: event.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#0033A0] text-white hover:bg-[#00256f]" onClick={saveQuestion}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CandidateDrawer({
  candidate,
  onClose,
}: {
  candidate: Candidate | null
  onClose: () => void
}) {
  const campaignId = useRouteCampaignId() || getRememberedCampaignId()
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null)

  const runAction = async (actionName: string, action: () => Promise<string>) => {
    setBusyAction(actionName)
    setActionMessage(null)
    try {
      const text = await action()
      setActionMessage({ type: "success", text })
    } catch (error) {
      setActionMessage({ type: "error", text: formatApiError(error, `${actionName} failed.`) })
    } finally {
      setBusyAction(null)
    }
  }

  const requireCampaignId = () => {
    if (!campaignId) throw new Error("Missing campaign_id. Open this candidate from a campaign leaderboard route.")
    return campaignId
  }

  return (
    <Sheet open={Boolean(candidate)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {candidate ? (
          <>
            <SheetHeader>
              <SheetTitle>{candidate.name}</SheetTitle>
              <SheetDescription>{candidate.email}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4">
              {actionMessage ? <FormMessage type={actionMessage.type}>{actionMessage.text}</FormMessage> : null}
              <div className="rounded-lg border bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">CV preview</p>
                <div className="mt-3 flex h-36 items-center justify-center rounded-lg border border-dashed bg-white text-sm text-muted-foreground">
                  PDF preview placeholder
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI reasoning</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {candidate.reasoning.map((line) => (
                    <li key={line} className="rounded-lg bg-slate-50 p-3">
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-foreground">Strengths</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {candidate.strengths.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Weaknesses</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {candidate.weaknesses.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Risk flags</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.riskFlags.length === 0 ? <StatusPill tone="green">No flags</StatusPill> : candidate.riskFlags.map((flag) => <StatusPill key={flag} tone="orange">{flag}</StatusPill>)}
                </div>
              </div>
              <div className="space-y-3">
                <ScoreBar label="CV Score" value={candidate.cvScore} />
                <ScoreBar label="Test Score" value={candidate.testScore} />
                <ScoreBar label="Interview Score" value={candidate.interviewScore} />
              </div>
            </div>
            <SheetFooter>
              <Button
                variant="outline"
                disabled={Boolean(busyAction)}
                onClick={() =>
                  runAction("Score CV", async () => {
                    const activeCampaignId = requireCampaignId()
                    await scoreCampaignCandidates(activeCampaignId, candidate.id)
                    return "CV scoring requested for this candidate."
                  })
                }
              >
                {busyAction === "Score CV" ? "Scoring..." : "Score CV"}
              </Button>
              <Button
                variant="outline"
                disabled={Boolean(busyAction)}
                onClick={() =>
                  runAction("Invite test", async () => {
                    const link = await inviteCandidateToTest(candidate.id)
                    return `Test invitation created: ${link.url}`
                  })
                }
              >
                {busyAction === "Invite test" ? "Inviting..." : "Invite Test"}
              </Button>
              <Button
                className="bg-[#0033A0] text-white hover:bg-[#00256f]"
                disabled={Boolean(busyAction)}
                onClick={() =>
                  runAction("Invite interview", async () => {
                    const link = await inviteCandidateToInterview(candidate.id)
                    return `Interview invitation created: ${link.url}`
                  })
                }
              >
                {busyAction === "Invite interview" ? "Inviting..." : "Invite Interview"}
              </Button>
              <Button
                variant="outline"
                className="text-emerald-700"
                disabled={Boolean(busyAction)}
                onClick={() => runAction("Final pass", async () => {
                  await finalDecision(candidate.id, "PASSED", "Marked from HR leaderboard.")
                  return "Candidate marked as PASSED."
                })}
              >
                Pass
              </Button>
              <Button
                variant="outline"
                className="text-red-700"
                disabled={Boolean(busyAction)}
                onClick={() => runAction("Final reject", async () => {
                  await finalDecision(candidate.id, "REJECTED", "Marked from HR leaderboard.")
                  return "Candidate marked as REJECTED."
                })}
              >
                Reject
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function CandidateRankingTable({
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
  if (candidates.length === 0) {
    return <EmptyState title="No candidates" description="Candidates will appear here after CV submission or backend scoring." />
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead>CV Summary</TableHead>
            <TableHead className="w-24">CV Score</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-28 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates
            .slice()
            .sort((a, b) => b.cvScore - a.cvScore)
            .map((candidate, index) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-semibold text-muted-foreground">#{index + 1}</TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">{candidate.email}</p>
                </TableCell>
                <TableCell className="max-w-xl">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{cvSummary(candidate)}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.matchedSkills.slice(0, 3).map((skill) => (
                      <StatusPill key={skill} tone="slate">
                        {skill}
                      </StatusPill>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="rounded-md bg-[#0033A0]/10 px-2 py-1 text-sm font-semibold text-[#0033A0]">
                    {candidate.cvScore}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusPill tone={candidateStatusTone(candidate.status)}>{candidate.status}</StatusPill>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {candidate.status === "CV Screening" && onQuickAction && (
                      <Button 
                        size="sm" 
                        className="bg-[#0033A0] text-white hover:bg-[#00256f]"
                        disabled={Boolean(busyAction)}
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuickAction(candidate, "Invite test", async () => {
                            const link = await inviteCandidateToTest(candidate.id)
                            return `Đã gửi bài Test: ${link.url}`
                          })
                        }}
                      >
                        Gửi bài Test
                      </Button>
                    )}
                    {candidate.status === "Rejected" && onQuickAction && (
                      <Button 
                        size="sm" 
                        className="bg-[#c6203f] text-white hover:bg-[#a91935]"
                        disabled={Boolean(busyAction)}
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuickAction(candidate, "Invite test", async () => {
                            const link = await inviteCandidateToTest(candidate.id)
                            return `Đã cứu ứng viên và chuyển vào Vòng 2: ${link.url}`
                          })
                        }}
                      >
                        Cứu ứng viên (Vòng 2)
                      </Button>
                    )}
                    {(candidate.status === "Test Sent" || candidate.status === "Interview") && onQuickAction && (
                      <Button 
                        size="sm" 
                        className="bg-[#0033A0] text-white hover:bg-[#00256f]"
                        disabled={Boolean(busyAction)}
                        onClick={(e) => {
                          e.stopPropagation()
                          onQuickAction(candidate, "Invite interview", async () => {
                            const link = await inviteCandidateToInterview(candidate.id)
                            return `Đã tạo phòng phỏng vấn: ${link.url}`
                          })
                        }}
                      >
                        Tạo phòng phỏng vấn ảo
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onViewMore(candidate)}>
                      {candidate.status === "CV Screening" || candidate.status === "Test Sent" || candidate.status === "Interview" ? "..." : "View more"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function LeaderboardScreen() {
  const campaignId = useRouteCampaignId() || getRememberedCampaignId()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"All" | CandidateStatus>("All")
  const [skillFilter, setSkillFilter] = useState("All")
  const [sourceFilter, setSourceFilter] = useState("All")
  const [minScore, setMinScore] = useState("0")
  const [leaderboardCandidates, setLeaderboardCandidates] = useState<Candidate[]>(candidates)
  const [drawerCandidate, setDrawerCandidate] = useState<Candidate | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const handleQuickAction = async (candidate: Candidate, actionName: string, actionFn: () => Promise<string>) => {
    setBusyAction(actionName)
    setMessage("")
    try {
      const text = await actionFn()
      setMessage(text)
    } catch (error) {
      setMessage(formatApiError(error, `${actionName} failed.`))
    } finally {
      setBusyAction(null)
    }
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        let nextCampaignId = campaignId
        if (!nextCampaignId) {
          const backendCampaigns = await listCampaigns()
          const activeCampaign = backendCampaigns.find((campaign) => campaign.status === "ACTIVE") ?? backendCampaigns[0]
          nextCampaignId = activeCampaign?.id ?? ""
        }
        if (!nextCampaignId) {
          if (mounted) setMessage("No backend campaign found. Using local demo leaderboard.")
          return
        }
        rememberActiveCampaign(nextCampaignId)
        const rows = await listLeaderboard(nextCampaignId)
        if (mounted && rows.length > 0) setLeaderboardCandidates(rows.map(mapBackendLeaderboardRow))
      } catch (error) {
        if (mounted) setMessage(`${formatApiError(error)} Using local demo leaderboard until the backend is running.`)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [campaignId])

  const skills = Array.from(new Set(leaderboardCandidates.flatMap((candidate) => candidate.matchedSkills)))
  const filtered = leaderboardCandidates.filter((candidate) => {
    const matchesSearch = `${candidate.name} ${candidate.email}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "All" || candidate.status === statusFilter
    const matchesSkill = skillFilter === "All" || candidate.matchedSkills.includes(skillFilter)
    const matchesSource = sourceFilter === "All" || candidate.source === sourceFilter
    const matchesScore = candidate.totalScore >= Number(minScore || 0)
    return matchesSearch && matchesStatus && matchesSkill && matchesSource && matchesScore
  })

  return (
    <>
      <PageHeader title="Candidate Leaderboard" subtitle="Review CV ranking summaries and open full candidate details when needed." />
      <div className="space-y-6">
        {message ? <FormMessage type="success">{message}</FormMessage> : null}
        <Card className="rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Filters</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setAuthOpen(true)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Result Emails
              </Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name/email" className="pl-9" />
            </div>
            <Input value={minScore} onChange={(event) => setMinScore(event.target.value)} type="number" min={0} max={100} placeholder="Score range min" />
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All skills</SelectItem>
                {skills.map((skill) => (
                  <SelectItem key={skill} value={skill}>
                    {skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "All" | CandidateStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All status</SelectItem>
                {pipelineStages.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All sources</SelectItem>
                {sourceData.map((source) => (
                  <SelectItem key={source.name} value={source.name}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="rounded-lg p-4 shadow-sm">
          <CandidateRankingTable candidates={filtered} onViewMore={setDrawerCandidate} onQuickAction={handleQuickAction} busyAction={busyAction} />
        </Card>
      </div>

      <CandidateDrawer candidate={drawerCandidate} onClose={() => setDrawerCandidate(null)} />
      <SecurityAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onVerified={() => setMessage("Bulk result emails verified. Selective sending is handled by the backend bulk-email endpoint.")}
        onLocked={() => setMessage("Mock security log recorded for 3 failed verification attempts.")}
      />
    </>
  )
}

export function CompareScreen() {
  const campaignId = useRouteCampaignId() || getRememberedCampaignId()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    const stored = window.localStorage.getItem("compareCandidates")
    if (stored) {
      setSelectedIds(JSON.parse(stored) as string[])
    } else {
      setSelectedIds(candidates.slice(0, 3).map((candidate) => candidate.id))
    }
  }, [])

  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.id)).slice(0, 5)
  const visibleCandidates = selectedCandidates.length >= 2 ? selectedCandidates : candidates.slice(0, 3)
  const bestScore = Math.max(...visibleCandidates.map((candidate) => candidate.totalScore))

  const metricRows = [
    { label: "Total Score", key: "totalScore" as const },
    { label: "CV Score", key: "cvScore" as const },
    { label: "Test Score", key: "testScore" as const },
    { label: "Interview Score", key: "interviewScore" as const },
    { label: "Years of Experience", key: "yearsExperience" as const },
  ]

  const numericMax = (key: (typeof metricRows)[number]["key"]) => Math.max(...visibleCandidates.map((candidate) => Number(candidate[key])))

  return (
    <>
      <PageHeader title="Candidate Compare" subtitle="Side-by-side comparison for 2-5 selected candidates." />
      <div className="space-y-4">
        <Link href={campaignId ? `/hr/campaigns/${campaignId}/leaderboard` : "/hr"}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leaderboard
          </Button>
        </Link>
        <Card className="overflow-x-auto rounded-lg p-4 shadow-sm">
          <div className="min-w-[860px]">
            <div className="grid" style={{ gridTemplateColumns: `190px repeat(${visibleCandidates.length}, minmax(190px, 1fr))` }}>
              <div className="border-b p-3 text-sm font-semibold text-muted-foreground">Candidate</div>
              {visibleCandidates.map((candidate) => (
                <div key={candidate.id} className="border-b p-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{candidate.name}</p>
                    {candidate.totalScore === bestScore ? <StatusPill tone="green">Recommended</StatusPill> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>
                </div>
              ))}
              {metricRows.map((row) => {
                const max = numericMax(row.key)
                return (
                  <div key={row.label} className="contents">
                    <div className="border-b bg-slate-50 p-3 text-sm font-medium text-muted-foreground">{row.label}</div>
                    {visibleCandidates.map((candidate) => (
                      <div key={`${candidate.id}-${row.key}`} className={cn("border-b p-3 text-sm font-semibold", Number(candidate[row.key]) === max ? "bg-emerald-50 text-emerald-700" : "text-foreground")}>
                        {candidate[row.key]}
                      </div>
                    ))}
                  </div>
                )
              })}
              {[
                ["Key Skills", (candidate: Candidate) => candidate.matchedSkills.join(", ")],
                ["Missing Skills", (candidate: Candidate) => candidate.missingSkills.join(", ") || "None"],
                ["Salary Expectation", (candidate: Candidate) => candidate.salaryExpectation || "Not provided"],
                ["AI Recommendation", (candidate: Candidate) => candidate.aiRecommendation],
              ].map(([label, render]) => (
                <div key={String(label)} className="contents">
                  <div className="border-b bg-slate-50 p-3 text-sm font-medium text-muted-foreground">{String(label)}</div>
                  {visibleCandidates.map((candidate) => (
                    <div key={`${candidate.id}-${String(label)}`} className="border-b p-3 text-sm text-foreground">
                      {(render as (candidate: Candidate) => string)(candidate)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

export function InterviewReportScreen() {
  const campaignId = useRouteCampaignId() || getRememberedCampaignId()
  const candidate = candidates[0]

  return (
    <>
      <PageHeader title="Virtual Interview Report" subtitle="Transcript, competency radar chart, summary, recommendation, and evidence." />
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{candidate.name}</h2>
            <p className="text-sm text-muted-foreground">{candidate.position}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Export Report</Button>
            <Link href={campaignId ? `/hr/campaigns/${campaignId}/leaderboard` : "/hr"}>
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
