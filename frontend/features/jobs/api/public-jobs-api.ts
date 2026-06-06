import { request } from "@/shared/api/client"
import type { BackendPosition, BackendCandidate, CandidateApplicationPayload } from "@/shared/api/backend-types"

export function listPublicPositions() {
  return request<BackendPosition[]>(`/public/positions`)
}

export function getPublicJob(positionId: string | undefined) {
  return request<BackendPosition>(`/public/jobs/${positionId}`)
}

export function applyToPublicJob(
  positionId: string,
  payload: { full_name: string; email: string; phone?: string | null; cv_text: string; cv_file_name?: string | null },
) {
  return request<BackendCandidate>(`/public/jobs/${positionId}/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function applyFileToPublicJob(positionId: string, file: File) {
  const form = new FormData()
  form.append("file", file)
  return request<BackendCandidate>(`/public/jobs/${positionId}/apply-file`, {
    method: "POST",
    body: form,
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

export type { BackendPosition, CandidateApplicationPayload }
export { formatApiError } from "@/shared/api/client"
