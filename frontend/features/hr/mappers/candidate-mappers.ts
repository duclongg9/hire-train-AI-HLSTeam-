import type { BackendLeaderboardRow } from "@/features/hr/api/hr-api"
import type { Candidate, CandidateStatus } from "@/lib/recruitment/mock-data"

export function toCandidateStatus(status: string): CandidateStatus {
  if (status === "PASSED" || status === "CONTACTED") return "Offer"
  if (status === "REJECTED") return "Rejected"
  if (status.startsWith("INTERVIEW")) return "Interview"
  if (status.startsWith("TEST")) return "Test Sent"
  if (status === "CV_SCORED" || status === "SHORTLISTED") return "CV Screening"
  return "Applied"
}

export function cvSummary(candidate: Candidate) {
  if (candidate.status === "Applied") return "Waiting for AI..."
  const skills = candidate.matchedSkills.slice(0, 3).join(", ")
  const missing = candidate.missingSkills[0] ? ` Missing: ${candidate.missingSkills[0]}.` : ""
  return `${candidate.yearsExperience} years experience. Matches: ${skills || "under review"}.${missing}`
}

export function mapBackendLeaderboardRow(row: BackendLeaderboardRow, index: number): Candidate {
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

export function candidateStatusTone(status: CandidateStatus) {
  if (status === "Offer" || status === "Interview") return "green"
  if (status === "Rejected") return "red"
  if (status === "Test Sent") return "orange"
  return "blue"
}
