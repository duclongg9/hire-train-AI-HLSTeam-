"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Filter, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Star,
  XCircle,
  Check,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from "recharts"

interface Candidate {
  id: string
  name: string
  avatar: string
  matchScore: number
  csatImpact: number
  cxCapability: "Xuất sắc" | "Tốt" | "Trung bình" | "Cần cải thiện"
  timeApplied: string
  strengths: string[]
  gaps: string[]
  riskTags: string[]
  skills: { subject: string; score: number; fullMark: number }[]
  aiSuggestion: {
    text: string
    type: "highly-recommended" | "recommended" | "warning" | "not-recommended"
  }
  status: "pending" | "approved" | "rejected"
}

const candidates: Candidate[] = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    avatar: "NA",
    matchScore: 92,
    csatImpact: 94,
    cxCapability: "Xuất sắc",
    timeApplied: "2 giờ trước",
    strengths: ["Kỹ năng giao tiếp xuất sắc", "5 năm kinh nghiệm ngân hàng SHB"],
    gaps: [],
    riskTags: [],
    skills: [
      { subject: "CSKH", score: 95, fullMark: 100 },
      { subject: "Tín dụng", score: 88, fullMark: 100 },
      { subject: "Tư vấn", score: 90, fullMark: 100 },
      { subject: "Sản phẩm SHB", score: 92, fullMark: 100 },
      { subject: "Tiếng Anh", score: 80, fullMark: 100 },
    ],
    aiSuggestion: {
      text: "Đề xuất phỏng vấn ngay",
      type: "highly-recommended"
    },
    status: "pending"
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    avatar: "TB",
    matchScore: 85,
    csatImpact: 87,
    cxCapability: "Tốt",
    timeApplied: "5 giờ trước",
    strengths: ["Chứng chỉ CFA Level 2", "Kinh nghiệm tư vấn đầu tư"],
    gaps: ["Thiếu kinh nghiệm bán lẻ SHB"],
    riskTags: [],
    skills: [
      { subject: "CSKH", score: 82, fullMark: 100 },
      { subject: "Tín dụng", score: 90, fullMark: 100 },
      { subject: "Tư vấn", score: 88, fullMark: 100 },
      { subject: "Sản phẩm SHB", score: 70, fullMark: 100 },
      { subject: "Tiếng Anh", score: 92, fullMark: 100 },
    ],
    aiSuggestion: {
      text: "Phù hợp, nên phỏng vấn",
      type: "recommended"
    },
    status: "pending"
  },
  {
    id: "3",
    name: "Lê Hoàng Cường",
    avatar: "LC",
    matchScore: 78,
    csatImpact: 75,
    cxCapability: "Trung bình",
    timeApplied: "1 ngày trước",
    strengths: ["Năng động, chịu áp lực tốt"],
    gaps: ["Thiếu kinh nghiệm xử lý khiếu nại", "Chưa có chứng chỉ nghiệp vụ"],
    riskTags: ["Nhồi nhét từ khóa"],
    skills: [
      { subject: "CSKH", score: 72, fullMark: 100 },
      { subject: "Tín dụng", score: 60, fullMark: 100 },
      { subject: "Tư vấn", score: 72, fullMark: 100 },
      { subject: "Sản phẩm SHB", score: 55, fullMark: 100 },
      { subject: "Tiếng Anh", score: 70, fullMark: 100 },
    ],
    aiSuggestion: {
      text: "Cảnh báo: Rủi ro CV ảo",
      type: "warning"
    },
    status: "pending"
  },
  {
    id: "4",
    name: "Phạm Minh Đức",
    avatar: "MD",
    matchScore: 71,
    csatImpact: 68,
    cxCapability: "Cần cải thiện",
    timeApplied: "2 ngày trước",
    strengths: ["3 năm kinh nghiệm CSKH tổng đài"],
    gaps: ["Thiếu kiến thức sản phẩm tài chính SHB"],
    riskTags: ["Khoảng trống 8 tháng"],
    skills: [
      { subject: "CSKH", score: 85, fullMark: 100 },
      { subject: "Tín dụng", score: 55, fullMark: 100 },
      { subject: "Tư vấn", score: 68, fullMark: 100 },
      { subject: "Sản phẩm SHB", score: 45, fullMark: 100 },
      { subject: "Tiếng Anh", score: 65, fullMark: 100 },
    ],
    aiSuggestion: {
      text: "Cảnh báo: Rủi ro nghỉ việc cao",
      type: "warning"
    },
    status: "pending"
  },
]

const filters = [
  { id: "score80", label: "Điểm > 80", active: false },
  { id: "banking", label: "Có kinh nghiệm ngân hàng", active: false },
  { id: "gaps", label: "Có kỹ năng thiếu", active: false },
]

function AiSuggestionBadge({ suggestion }: { suggestion: Candidate["aiSuggestion"] }) {
  const config = {
    "highly-recommended": {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      icon: <Star className="w-3.5 h-3.5 fill-emerald-500" />
    },
    "recommended": {
      bg: "bg-blue-50",
      border: "border-blue-200", 
      text: "text-blue-700",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />
    },
    "warning": {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      icon: <AlertTriangle className="w-3.5 h-3.5" />
    },
    "not-recommended": {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      icon: <XCircle className="w-3.5 h-3.5" />
    }
  }

  const style = config[suggestion.type]

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium",
      style.bg, style.border, style.text
    )}>
      {style.icon}
      {suggestion.text}
    </div>
  )
}

function CsatImpactBadge({ score, capability }: { score: number; capability: Candidate["cxCapability"] }) {
  const colorClass = capability === "Xuất sắc" 
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : capability === "Tốt"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : capability === "Trung bình"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200"

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border", colorClass)}>
        CSAT +{score}%
      </div>
      <span className={cn(
        "text-[10px] font-medium",
        capability === "Xuất sắc" ? "text-emerald-600" :
        capability === "Tốt" ? "text-blue-600" :
        capability === "Trung bình" ? "text-amber-600" : "text-red-600"
      )}>
        {capability}
      </span>
    </div>
  )
}

function ScoreCircle({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 20
  const strokeDashoffset = circumference - (score / 100) * circumference
  
  return (
    <div className="relative w-14 h-14">
      <svg className="w-14 h-14 -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx="28"
          cy="28"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            score >= 85 ? "text-emerald-500" :
            score >= 70 ? "text-[#F37021]" : "text-red-500"
          )}
        />
      </svg>
      <span className={cn(
        "absolute inset-0 flex items-center justify-center font-bold text-sm",
        score >= 85 ? "text-emerald-600" :
        score >= 70 ? "text-[#F37021]" : "text-red-600"
      )}>
        {score}
      </span>
    </div>
  )
}

function MiniRadarChart({ data }: { data: Candidate["skills"] }) {
  return (
    <div className="w-28 h-28">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 8, fill: "#6b7280" }}
          />
          <Radar
            dataKey="score"
            stroke="#0033A0"
            fill="#0033A0"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CandidateTable() {
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [candidateStatuses, setCandidateStatuses] = useState<Record<string, "pending" | "approved" | "rejected">>({})

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }

  const handleDecision = (candidateId: string, decision: "approved" | "rejected") => {
    setCandidateStatuses(prev => ({
      ...prev,
      [candidateId]: decision
    }))
  }

  const filteredCandidates = candidates.filter(c => {
    if (activeFilters.includes("score80") && c.matchScore <= 80) return false
    if (activeFilters.includes("gaps") && c.gaps.length === 0) return false
    return true
  })

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Xếp hạng ứng viên</h2>
            <p className="text-sm text-muted-foreground mt-1">AI đã phân tích và xếp hạng {candidates.length} ứng viên</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Lọc nhanh:</span>
          </div>
          {filters.map(filter => (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                activeFilters.includes(filter.id)
                  ? "bg-[#0033A0] text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {filter.label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm ứng viên..."
              className="pl-10 pr-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0033A0]/20"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ứng viên</th>
              <th className="text-center px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Điểm</th>
              <th className="text-center px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <div className="flex flex-col items-center">
                  <span>CSAT</span>
                  <span className="text-[10px] text-[#F37021] font-normal normal-case">(CX)</span>
                </div>
              </th>
              <th className="text-center px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kỹ năng</th>
              <th className="text-left px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Analysis & Reasoning</th>
              <th className="text-center px-3 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Suggestion</th>
              <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Final Decision</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate, index) => (
              <motion.tr
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "border-b border-border hover:bg-muted/30 transition-colors cursor-pointer",
                  expandedRow === candidate.id && "bg-muted/20"
                )}
                onClick={() => setExpandedRow(expandedRow === candidate.id ? null : candidate.id)}
              >
                {/* Candidate */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                      index === 0 ? "bg-gradient-to-br from-[#0033A0] to-[#0055DD]" : "bg-gradient-to-br from-gray-400 to-gray-500"
                    )}>
                      {candidate.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {candidate.timeApplied}
                      </p>
                      {candidate.riskTags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {candidate.riskTags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Score */}
                <td className="px-3 py-4">
                  <div className="flex justify-center">
                    <ScoreCircle score={candidate.matchScore} />
                  </div>
                </td>

                {/* CSAT Impact */}
                <td className="px-3 py-4">
                  <div className="flex justify-center">
                    <CsatImpactBadge score={candidate.csatImpact} capability={candidate.cxCapability} />
                  </div>
                </td>

                {/* Radar Chart */}
                <td className="px-3 py-4">
                  <div className="flex justify-center">
                    <MiniRadarChart data={candidate.skills} />
                  </div>
                </td>

                {/* AI Analysis & Reasoning */}
                <td className="px-3 py-4">
                  <div className="space-y-1 max-w-xs">
                    {candidate.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-emerald-700">{s}</span>
                      </div>
                    ))}
                    {candidate.gaps.map((g, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <TrendingDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-red-600">{g}</span>
                      </div>
                    ))}
                  </div>
                </td>

                {/* AI Suggestion */}
                <td className="px-3 py-4">
                  <div className="flex justify-center">
                    <AiSuggestionBadge suggestion={candidate.aiSuggestion} />
                  </div>
                </td>

                {/* Final Decision */}
                <td className="px-4 py-4">
                  {candidateStatuses[candidate.id] ? (
                    <div className="flex justify-center">
                      {candidateStatuses[candidate.id] === "approved" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                          <Check className="w-4 h-4" />
                          Đã duyệt
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                          <X className="w-4 h-4" />
                          Từ chối
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDecision(candidate.id, "approved")
                        }}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 px-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDecision(candidate.id, "rejected")
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
