import { request } from "@/shared/api/client"
import type {
  BackendCampaign,
  BackendCampaignStatus,
  BackendCandidate,
  BackendCandidateScore,
  BackendLeaderboardRow,
  BackendRubricCriterion,
  BackendTestQuestion,
  BackendTokenLink,
} from "@/shared/api/backend-types"

export function listCampaigns() {
  return request<BackendCampaign[]>("/campaigns")
}

export function getCampaign(campaignId: string) {
  return request<BackendCampaign>(`/campaigns/${campaignId}`)
}

export function createCampaign(payload: { title: string; jd_text?: string | null; deadline_at?: string | null; start_date?: string | null; department_scope?: string | null; status?: string }) {
  return request<BackendCampaign>("/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateCampaign(campaignId: string, payload: { title?: string; jd_text?: string | null; status?: BackendCampaignStatus; deadline_at?: string | null }) {
  return request<BackendCampaign>(`/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function extractRubricFromJdFile(campaignId: string, file: File) {
  const form = new FormData()
  form.append("campaign_id", campaignId)
  form.append("file", file)
  return request<BackendRubricCriterion[]>("/campaigns/ai-core/jd/extract-rubric", {
    method: "POST",
    body: form,
  })
}

export function getRubric(campaignId: string) {
  return request<BackendRubricCriterion[]>(`/campaigns/${campaignId}/rubric`)
}

export function saveRubric(campaignId: string, criteria: Array<{ category: BackendRubricCriterion["category"]; name: string; weight: number; description?: string | null }>) {
  return request<BackendRubricCriterion[]>(`/campaigns/${campaignId}/rubric`, {
    method: "PUT",
    body: JSON.stringify({ criteria }),
  })
}

export function publishCampaign(campaignId: string) {
  return request<BackendCampaign>(`/campaigns/${campaignId}/publish`, {
    method: "POST",
  })
}

export function generateTestQuestions(campaignId: string, count = 15) {
  return request<BackendTestQuestion[]>(`/campaigns/${campaignId}/test-questions/generate`, {
    method: "POST",
    body: JSON.stringify({ count }),
  })
}

export function listTestQuestions(campaignId: string) {
  return request<BackendTestQuestion[]>(`/campaigns/${campaignId}/test-questions`)
}

export function publishTestQuestions(campaignId: string) {
  return request<BackendTestQuestion[]>(`/campaigns/${campaignId}/test-questions/publish`, {
    method: "POST",
  })
}

export function listCandidates(campaignId: string) {
  return request<BackendCandidate[]>(`/campaigns/${campaignId}/candidates`)
}

export function listLeaderboard(campaignId: string) {
  return request<BackendLeaderboardRow[]>(`/campaigns/${campaignId}/leaderboard`)
}

export function scoreCampaignCandidates(campaignId: string, candidateId?: string) {
  return request<BackendCandidateScore | BackendCandidateScore[]>(`/campaigns/${campaignId}/candidates/score`, {
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
  BackendLeaderboardRow,
  BackendRubricCriterion,
  BackendTestQuestion,
}

export { formatApiError, healthCheck } from "@/shared/api/client"
