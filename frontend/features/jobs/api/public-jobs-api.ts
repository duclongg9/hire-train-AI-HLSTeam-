import { request } from "@/shared/api/client"
import type { BackendCampaign, BackendCandidate, CandidateApplicationPayload } from "@/shared/api/backend-types"

export function listCampaigns() {
  return request<BackendCampaign[]>("/campaigns")
}

export function getPublicJob(campaignId: string | undefined) {
  return request<BackendCampaign>(`/public/jobs/${campaignId}`)
}

export function applyToPublicJob(
  campaignId: string,
  payload: { full_name: string; email: string; phone?: string | null; cv_text: string; cv_file_name?: string | null },
) {
  return request<BackendCandidate>(`/public/jobs/${campaignId}/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function submitCandidateApplication(payload: CandidateApplicationPayload) {
  const fullName = `${payload.lastName} ${payload.firstName}`.replace(/\s+/g, " ").trim()
  return applyToPublicJob(payload.campaignId, {
    full_name: fullName,
    email: payload.email,
    phone: payload.phone || null,
    cv_file_name: payload.cvFileName,
    cv_text:
      payload.cvText ||
      [
        `Candidate applied for ${payload.jobTitle}.`,
        `Work location: ${payload.workLocation}.`,
        `CV file submitted: ${payload.cvFileName}.`,
      ].join("\n"),
  })
}

export type { BackendCampaign, CandidateApplicationPayload }
export { formatApiError } from "@/shared/api/client"
