import { request } from "@/shared/api/client"
import type {
  BackendCampaign,
  BackendCampaignStatus,
  BackendPosition,
  BackendCandidate,
  BackendCandidateScore,
  BackendLeaderboardRow,
  BackendRubricCriterion,
  BackendInterviewRubricGroup,
  BackendTestQuestion,
  BackendTokenLink,
} from "@/shared/api/backend-types"

export function listCampaigns() {
  return request<BackendCampaign[]>("/campaigns")
}

export function getCampaign(campaignId: string) {
  return request<BackendCampaign>(`/campaigns/${campaignId}`)
}

export function createCampaign(payload: { title: string; jd_text?: string | null; deadline_at?: string | null; start_date?: string | null; end_date?: string | null; department_scope?: string | null; status?: string }) {
  return request<BackendCampaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateCampaign(campaignId: string, payload: { title?: string; jd_text?: string | null; status?: BackendCampaignStatus; start_date?: string | null; end_date?: string | null; deadline_at?: string | null }) {
  return request<BackendCampaign>(`/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function listPositions(campaignId: string) {
  return request<BackendPosition[]>(`/campaigns/${campaignId}/positions`)
}

export function createPosition(campaignId: string, payload: { title: string; headcount: number; budget?: string | null; jd_text?: string | null }) {
  return request<BackendPosition>(`/campaigns/${campaignId}/positions`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function createPositionFromFile(campaignId: string, payload: { title: string; headcount: number; budget?: string | null }, file: File) {
  const form = new FormData()
  form.append("title", payload.title)
  form.append("headcount", payload.headcount.toString())
  if (payload.budget) form.append("budget", payload.budget)
  form.append("file", file)
  return request<BackendPosition>(`/campaigns/${campaignId}/positions/upload`, {
    method: "POST",
    body: form,
  })
}

export function analyzeJd(positionId: string) {
  return request<BackendRubricCriterion[]>(`/positions/${positionId}/analyze-jd`, {
    method: "POST",
  })
}

export function extractRubricFromJdFile(positionId: string, file: File) {
  const form = new FormData()
  form.append("position_id", positionId)
  form.append("file", file)
  return request<BackendRubricCriterion[]>("/positions/ai-core/jd/extract-rubric", {
    method: "POST",
    body: form,
  })
}

export function getRubric(positionId: string) {
  return request<BackendRubricCriterion[]>(`/positions/${positionId}/rubric`)
}

export function saveRubric(positionId: string, criteria: Array<{ category: BackendRubricCriterion["category"]; name: string; weight: number; description?: string | null }>) {
  return request<BackendRubricCriterion[]>(`/positions/${positionId}/rubric`, {
    method: "PUT",
    body: JSON.stringify({ criteria }),
  })
}

export function publishCampaign(campaignId: string) {
  return request<BackendCampaign>(`/campaigns/${campaignId}/publish`, {
    method: "POST",
  })
}

export function generateTestQuestions(positionId: string, count = 15) {
  return request<BackendTestQuestion[]>(`/positions/${positionId}/test-questions/generate`, {
    method: "POST",
    body: JSON.stringify({ count }),
  })
}

export function listTestQuestions(positionId: string) {
  return request<BackendTestQuestion[]>(`/positions/${positionId}/test-questions`)
}

export function saveTestQuestions(positionId: string, questions: Array<{ question_text: string; question_type: string; options: Array<Record<string, unknown>>; correct_option_id: string | null }>) {
  return request<BackendTestQuestion[]>(`/positions/${positionId}/test-questions`, {
    method: "PUT",
    body: JSON.stringify({ questions }),
  })
}

export async function publishPosition(positionId: string) {
  return request<BackendPosition>(`/positions/${positionId}/publish`, {
    method: "POST"
  })
}

export async function closePosition(positionId: string) {
  return request<BackendPosition>(`/positions/${positionId}/close`, {
    method: "POST"
  })
}

export async function closeCampaign(campaignId: string) {
  return request<BackendCampaign>(`/campaigns/${campaignId}/close`, {
    method: "POST"
  })
}

export async function getInterviewRubric(positionId: string) {
  return request<BackendInterviewRubricGroup[]>(`/positions/${positionId}/interview-rubric`)
}

export async function saveInterviewRubric(positionId: string, groups: BackendInterviewRubricGroup[]) {
  return request<BackendInterviewRubricGroup[]>(`/positions/${positionId}/interview-rubric`, {
    method: "PUT",
    body: JSON.stringify({ groups }),
  })
}

export function listCandidates(campaignId: string) {
  return request<BackendCandidate[]>(`/campaigns/${campaignId}/candidates`)
}

export function listLeaderboard(positionId: string) {
  return request<BackendLeaderboardRow[]>(`/positions/${positionId}/leaderboard`)
}

export function scorePositionCandidates(positionId: string, candidateId?: string) {
  return request<BackendCandidateScore | BackendCandidateScore[]>(`/positions/${positionId}/candidates/score`, {
    method: "POST",
    body: JSON.stringify(candidateId ? { candidate_id: candidateId } : {}),
  })
}

export function inviteCandidateToTest(candidateId: string) {
  return request<BackendTokenLink>(`/candidates/${candidateId}/invite-test`, {
    method: "POST",
  })
}

export function inviteCandidateToInterview(candidateId: string) {
  return request<BackendTokenLink>(`/candidates/${candidateId}/invite-interview`, {
    method: "POST",
  })
}

export function finalDecision(candidateId: string, decision: "PASSED" | "REJECTED", reason?: string) {
  return request<BackendCandidate>(`/candidates/${candidateId}/final-decision`, {
    method: "POST",
    body: JSON.stringify({ decision, reason }),
  })
}

export type {
  BackendCampaign,
  BackendPosition,
  BackendLeaderboardRow,
  BackendRubricCriterion,
  BackendInterviewRubricGroup,
  BackendTestQuestion,
}

export { formatApiError, healthCheck } from "@/shared/api/client"
