"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Download, Loader2, AlertCircle, RefreshCw } from "lucide-react"

import { CandidateRankingTable, CandidateDrawer } from "@/features/hr/containers/hr-screens"
import { listLeaderboard, scorePositionCandidates, formatApiError, type BackendLeaderboardRow } from "@/features/hr/api/hr-api"
import { Button } from "@/components/ui/button"
import type { Candidate } from "@/lib/recruitment/mock-data"

// Map BackendLeaderboardRow → Candidate (shape dùng bởi CandidateRankingTable)
function mapRow(row: BackendLeaderboardRow): Candidate {
  const c = row.candidate
  const score = row.score?.score ?? 0
  const breakdown = row.score?.score_breakdown ?? {}
  const matchedSkills = Object.keys(breakdown).length > 0 ? Object.keys(breakdown) : []

  return {
    id: c.id,
    name: c.full_name,
    email: c.email,
    position: c.cv_file_name ?? "Chưa rõ vị trí",
    source: "Website",
    cvScore: Math.round(score),
    testScore: 0,
    interviewScore: 0,
    totalScore: Math.round(score),
    matchedSkills,
    missingSkills: row.score?.badge === "GAP" ? ["Cần thêm bằng chứng phù hợp"] : [],
    status: (() => {
      const s = c.status
      if (s === "PASSED" || s === "CONTACTED") return "Offer"
      if (s === "REJECTED") return "Rejected"
      if (s.startsWith("INTERVIEW")) return "Interview"
      if (s.startsWith("TEST")) return "Test Sent"
      if (s === "CV_SCORED" || s === "SHORTLISTED") return "CV Screening"
      return "Applied"
    })() as Candidate["status"],
    progress: row.score ? 70 : 20,
    yearsExperience: 0,
    salaryExpectation: undefined,
    aiRecommendation: row.score?.badge === "STRONG" ? "Khuyến nghị vào shortlist." : "Cần HR xem xét thêm.",
    strengths: matchedSkills.slice(0, 3).map((s) => ({ trait: s, evidence: "Dựa trên phân tích CV bởi AI." })),
    weaknesses: row.score?.badge === "GAP" ? [{ trait: "Cần thêm bằng chứng", evidence: "AI đánh dấu GAP." }] : [],
    riskFlags: row.score?.risk_flags ?? [],
    reasoning: row.score?.ai_reasoning
      ? [row.score.ai_reasoning]
      : ["CV đang chờ phân tích AI."],
  }
}

export default function PipelinePage() {
  const params = useParams<{ campaignId?: string; positionId?: string }>()
  const campaignId = params?.campaignId ?? ""
  const positionId = params?.positionId ?? ""

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [scoring, setScoring] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const fetchLeaderboard = async () => {
    if (!positionId) {
      setError("Không tìm thấy positionId trong đường dẫn.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const rows: BackendLeaderboardRow[] = await listLeaderboard(positionId)
      const mappedCandidates = rows.map(mapRow)
      setCandidates(mappedCandidates)
      setSelectedCandidate((current) =>
        current ? mappedCandidates.find((candidate) => candidate.id === current.id) ?? current : current,
      )
    } catch (err) {
      setError(formatApiError(err, "Không thể tải danh sách ứng viên."))
    } finally {
      setLoading(false)
    }
  }

  const handleScoreAll = async () => {
    if (!positionId) return
    setScoring(true)
    try {
      await scorePositionCandidates(positionId)
      await fetchLeaderboard()
    } catch (err) {
      setError(formatApiError(err, "Không thể chấm điểm ứng viên."))
    } finally {
      setScoring(false)
    }
  }

  const handleQuickAction = async (_candidate: Candidate, actionName: string, actionFn: () => Promise<string>) => {
    setBusyAction(actionName)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const result = await actionFn()
      alert(result)
      // Refresh sau action
      await fetchLeaderboard()
    } catch (err) {
      alert(formatApiError(err, "Hành động thất bại. Vui lòng thử lại."))
    } finally {
      setBusyAction(null)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    // lưu positionId vào localStorage để CandidateDrawer dùng
    if (positionId && typeof window !== "undefined") {
      window.localStorage.setItem("activePositionId", positionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId])

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/hr/campaigns/${campaignId}`}>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pipeline Ứng viên</h1>
              <p className="text-sm text-slate-500 mt-1">
                {loading ? "Đang tải..." : `${candidates.length} ứng viên`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-white"
              onClick={handleScoreAll}
              disabled={scoring || loading}
            >
              {scoring ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang chấm điểm...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" />Chấm điểm AI (Tất cả)</>
              )}
            </Button>
            <Button variant="outline" className="bg-white">
              <Download className="w-4 h-4 mr-2" />
              Xuất dữ liệu
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={fetchLeaderboard} className="ml-2 underline hover:no-underline">
              Thử lại
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm font-medium">Đang tải ứng viên...</span>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <CandidateRankingTable
              candidates={candidates}
              onViewMore={(cand) => setSelectedCandidate(cand)}
              onQuickAction={handleQuickAction}
              busyAction={busyAction}
            />
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onActionComplete={fetchLeaderboard}
      />
    </div>
  )
}
