import { request } from "@/shared/api/client"
import type { BackendTestAttempt, BackendTestOpenResponse } from "@/shared/api/backend-types"

export function openCandidateTest(token: string) {
  return request<BackendTestOpenResponse>(`/candidate/test/${token}`)
}

export function startCandidateTest(token: string) {
  return request<{ attempt: BackendTestAttempt; duration_seconds: number }>(`/candidate/test/${token}/start`, {
    method: "POST",
  })
}

export function submitCandidateTest(
  token: string,
  payload: { answers: Array<{ question_id: string; selected_option_id: string | null }>; auto_submitted?: boolean; duration_seconds?: number | null },
) {
  return request<BackendTestAttempt>(`/candidate/test/${token}/submit`, {
    method: "POST",
    body: JSON.stringify({
      auto_submitted: false,
      duration_seconds: null,
      ...payload,
    }),
  })
}

export type { BackendTestQuestion } from "@/shared/api/backend-types"
export { formatApiError } from "@/shared/api/client"
