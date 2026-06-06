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
  end_date: string | null
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
  is_jd_complete: boolean
  is_cv_rubric_complete: boolean
  is_interview_complete: boolean
  candidate_count: number
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

