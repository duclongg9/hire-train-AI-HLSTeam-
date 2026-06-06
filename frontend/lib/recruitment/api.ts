const DEFAULT_API_ORIGIN = ""

function normalizeApiOrigin(value?: string) {
  const raw = (value || DEFAULT_API_ORIGIN).replace(/\/$/, "")
  return raw.endsWith("/api") ? raw.slice(0, -4) : raw
}

export const API_ORIGIN = normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL)
export const API_BASE_URL = `${API_ORIGIN}/api`

export type BackendUserRole = "ADMIN" | "HR_MANAGER"
export type BackendCampaignStatus = "DRAFT" | "ACTIVE" | "CLOSED"
export type BackendCandidateStatus =
  | "APPLIED"
  | "CV_SCORED"
  | "SHORTLISTED"
  | "TEST_INVITED"
  | "TEST_IN_PROGRESS"
  | "TEST_COMPLETED"
  | "INTERVIEW_INVITED"
  | "INTERVIEW_IN_PROGRESS"
  | "INTERVIEW_COMPLETED"
  | "FINAL_REVIEW"
  | "PASSED"
  | "REJECTED"
  | "CONTACTED"

export interface BackendUser {
  id: string
  name: string
  email: string
  role: BackendUserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BackendAuditLog {
  id: string
  actor_email: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface BackendCampaign {
  id: string
  title: string
  department_scope: string | null
  jd_text: string | null
  status: BackendCampaignStatus
  public_token: string | null
  created_by: string | null
  start_date: string | null
  deadline_at: string | null
  created_at: string
  updated_at: string
}

export interface BackendPosition {
  id: string
  campaign_id: string
  title: string
  headcount: number
  budget: string | null
  jd_text: string | null
  status: "DRAFT" | "PUBLISHED" | "CLOSED"
  candidate_count: number
  created_at: string
  updated_at: string
}

export interface BackendRubricCriterion {
  id: string
  campaign_id: string
  category: "hard_skill" | "soft_skill" | "experience" | "certification"
  name: string
  weight: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface BackendInterviewRubricCriterion {
  id: string
  index: number
  criterion: string
  description: string
  weight: number
  tone: string
  editing?: boolean
}

export interface BackendInterviewRubricGroup {
  id: string
  name: string
  expanded: boolean
  criteria: BackendInterviewRubricCriterion[]
}

export interface BackendTestQuestion {
  id: string
  campaign_id: string
  question_text: string
  question_type: string
  difficulty: string | null
  skill_tag: string | null
  options: Array<Record<string, unknown>>
  correct_option_id: string | null
  explanation: string | null
  status: "DRAFT" | "APPROVED" | "PUBLISHED"
  order_index: number
  created_at: string
  updated_at: string
}

export interface BackendCandidate {
  id: string
  campaign_id: string
  full_name: string
  email: string
  phone: string | null
  cv_text: string | null
  cv_file_name: string | null
  status: BackendCandidateStatus
  final_decision: string | null
  final_decision_reason: string | null
  created_at: string
  updated_at: string
}

export interface BackendCandidateScore {
  id: string
  candidate_id: string
  campaign_id: string
  score: number
  badge: "STRONG" | "GAP" | "HIGH_RISK"
  ai_reasoning: string
  score_breakdown: Record<string, number>
  risk_flags: string[]
}

export interface BackendLeaderboardRow {
  candidate: BackendCandidate
  score: BackendCandidateScore | null
}

export interface BackendTokenLink {
  invitation_id: string
  candidate_id: string
  campaign_id: string
  token: string
  url: string
  expires_at: string
  email_event: Record<string, unknown>
}

export interface BackendTestOpenResponse {
  candidate: BackendCandidate
  campaign: BackendCampaign
  invitation: Record<string, unknown>
  questions: BackendTestQuestion[]
  duration_seconds: number
}

export interface BackendTestAttempt {
  id: string
  candidate_id: string
  campaign_id: string
  status: string
  score: number | null
  max_score: number | null
  percentage: number | null
  ai_feedback: string | null
}

export interface CandidateApplicationPayload {
  campaignId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  jobTitle: string
  workLocation: string
  cvFileName: string
  cvText?: string
}

export interface ApiFieldError {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  detail: unknown
  fieldErrors: ApiFieldError[]

  constructor(status: number, message: string, detail: unknown, fieldErrors: ApiFieldError[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
    this.fieldErrors = fieldErrors
  }
}

function getToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("token")
}

function isFormDataBody(body: BodyInit | null | undefined): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData
}

function fieldNameFromLoc(loc: unknown) {
  if (!Array.isArray(loc)) return "request"
  return loc.filter((part) => part !== "body").join(".") || "request"
}

function parseErrorDetail(detail: unknown, fallback: string) {
  if (typeof detail === "string") {
    return { message: detail, fieldErrors: [] as ApiFieldError[] }
  }

  if (Array.isArray(detail)) {
    const fieldErrors = detail.map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
      return {
        field: fieldNameFromLoc(record.loc),
        message: typeof record.msg === "string" ? record.msg : "Invalid value.",
      }
    })
    return {
      message: fieldErrors.map((item) => `${item.field}: ${item.message}`).join("; ") || fallback,
      fieldErrors,
    }
  }

  if (detail && typeof detail === "object") {
    return { message: JSON.stringify(detail), fieldErrors: [] as ApiFieldError[] }
  }

  return { message: fallback, fieldErrors: [] as ApiFieldError[] }
}

export function formatApiError(error: unknown, fallback = "Backend request failed.") {
  if (error instanceof ApiError) {
    if (error.fieldErrors.length > 0) {
      return error.fieldErrors.map((item) => `${item.field}: ${item.message}`).join("; ")
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const body = init.body as BodyInit | null | undefined

  if (!isFormDataBody(body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const fallback = `Backend request failed with ${response.status}.`
    let detail: unknown = undefined
    try {
      const body = (await response.json()) as { detail?: unknown }
      detail = body.detail
    } catch {
      detail = undefined
    }
    const parsed = parseErrorDetail(detail, fallback)
    throw new ApiError(response.status, parsed.message, detail, parsed.fieldErrors)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function healthCheck() {
  return fetch(`${API_ORIGIN}/health`).then(async (response) => {
    if (!response.ok) {
      throw new ApiError(response.status, `Backend health check failed with ${response.status}.`, undefined)
    }
    return response.json() as Promise<{
      status: string
      app_env: string
      storage_provider: string
      database_connected: boolean
      ai_provider: string
      interview_provider: string
      email_provider: string
    }>
  })
}

export function mockLogin(email: string, role: BackendUserRole) {
  return request<{ access_token: string; token_type: string; user: BackendUser }>("/auth/mock-login", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  })
}

export function listAdminUsers() {
  return request<BackendUser[]>("/admin/users")
}

export function createAdminUser(payload: { name: string; email: string; role?: BackendUserRole; is_active?: boolean }) {
  return request<BackendUser>("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      role: "HR_MANAGER",
      is_active: true,
      ...payload,
    }),
  })
}

export function listAuditLogs() {
  return request<BackendAuditLog[]>("/admin/audit-logs")
}

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

export function saveTestQuestions(positionId: string, questions: Array<{ question_text: string; question_type: string; options: any[]; correct_option_id: string | null }>) {
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

export function getPublicJob(positionId: string | undefined) {
  return request<BackendPosition>(`/public/jobs/${positionId}`)
}

export function listPublicPositions() {
  // Currently, we don't have a single endpoint for ALL public positions across campaigns.
  // We'll mock this by listing campaigns, then positions, but we actually just need positions.
  // Wait, let's add `listPublicPositions` directly to the backend if needed, 
  // or I can temporarily use a mock/listCampaigns wrapper if there's no endpoint.
  // Wait, I will add an endpoint `GET /public/positions` or `GET /positions`.
  return request<BackendPosition[]>(`/public/positions`)
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
