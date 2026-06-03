from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    HR_MANAGER = "HR_MANAGER"


class CampaignStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class CandidateStatus(str, Enum):
    APPLIED = "APPLIED"
    CV_SCORED = "CV_SCORED"
    SHORTLISTED = "SHORTLISTED"
    TEST_INVITED = "TEST_INVITED"
    TEST_IN_PROGRESS = "TEST_IN_PROGRESS"
    TEST_COMPLETED = "TEST_COMPLETED"
    INTERVIEW_INVITED = "INTERVIEW_INVITED"
    INTERVIEW_IN_PROGRESS = "INTERVIEW_IN_PROGRESS"
    INTERVIEW_COMPLETED = "INTERVIEW_COMPLETED"
    FINAL_REVIEW = "FINAL_REVIEW"
    PASSED = "PASSED"
    REJECTED = "REJECTED"
    CONTACTED = "CONTACTED"


class CandidateBadge(str, Enum):
    STRONG = "STRONG"
    GAP = "GAP"
    HIGH_RISK = "HIGH_RISK"


class RubricCategory(str, Enum):
    hard_skill = "hard_skill"
    soft_skill = "soft_skill"
    experience = "experience"
    certification = "certification"


class TestQuestionStatus(str, Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"


class InvitationStatus(str, Enum):
    SENT = "SENT"
    OPENED = "OPENED"
    EXPIRED = "EXPIRED"
    USED = "USED"


class TestAttemptStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    AUTO_SUBMITTED = "AUTO_SUBMITTED"
    SCORED = "SCORED"
    EXPIRED = "EXPIRED"


class InterviewSessionStatus(str, Enum):
    WAITING_ROOM = "WAITING_ROOM"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"
    EXPIRED = "EXPIRED"


class EmailEventStatus(str, Enum):
    PREVIEW = "PREVIEW"
    SENT = "SENT"
    FAILED = "FAILED"


class EmailType(str, Enum):
    TEST_INVITATION = "TEST_INVITATION"
    INTERVIEW_INVITATION = "INTERVIEW_INVITATION"
    PASS_RESULT = "PASS_RESULT"
    REJECT_RESULT = "REJECT_RESULT"
    SECURITY_ALERT = "SECURITY_ALERT"


class InterviewEventType(str, Enum):
    candidate_speech = "candidate_speech"
    ai_speech = "ai_speech"
    system_warning = "system_warning"
    network_disconnect = "network_disconnect"
    noise_detected = "noise_detected"
    time_warning = "time_warning"
    session_finished = "session_finished"


class Speaker(str, Enum):
    candidate = "candidate"
    ai = "ai"
    system = "system"


class Sentiment(str, Enum):
    calm = "calm"
    neutral = "neutral"
    frustrated = "frustrated"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def validate_email_value(value: str) -> str:
    if "@" not in value or "." not in value.split("@")[-1]:
        raise ValueError("A valid email address is required.")
    return value.lower().strip()


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class User(APIModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    email: str
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return validate_email_value(value)


class Campaign(APIModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    jd_text: str | None = None
    status: CampaignStatus = CampaignStatus.DRAFT
    public_token: str | None = None
    created_by: UUID | None = None
    deadline_at: datetime | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class RubricCriterion(APIModel):
    id: UUID = Field(default_factory=uuid4)
    campaign_id: UUID
    category: RubricCategory
    name: str
    weight: int = Field(ge=0, le=100)
    description: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class TestQuestion(APIModel):
    id: UUID = Field(default_factory=uuid4)
    campaign_id: UUID
    question_text: str
    question_type: str = "multiple_choice"
    difficulty: str | None = None
    skill_tag: str | None = None
    options: list[dict[str, Any]] = Field(default_factory=list)
    correct_option_id: str | None = None
    explanation: str | None = None
    status: TestQuestionStatus = TestQuestionStatus.DRAFT
    order_index: int = 0
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class Candidate(APIModel):
    id: UUID = Field(default_factory=uuid4)
    campaign_id: UUID
    full_name: str
    email: str
    phone: str | None = None
    cv_text: str | None = None
    cv_file_name: str | None = None
    status: CandidateStatus = CandidateStatus.APPLIED
    final_decision: str | None = None
    final_decision_reason: str | None = None
    final_decision_by: UUID | None = None
    final_decision_at: datetime | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return validate_email_value(value)


class CandidateScore(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    campaign_id: UUID
    score: float = Field(ge=0, le=100)
    badge: CandidateBadge
    ai_reasoning: str
    score_breakdown: dict[str, Any] = Field(default_factory=dict)
    risk_flags: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class CandidateStageEvent(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    campaign_id: UUID
    from_status: CandidateStatus | None = None
    to_status: CandidateStatus
    reason: str | None = None
    actor_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)


class TestInvitation(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    campaign_id: UUID
    token_hash: str
    expires_at: datetime
    status: InvitationStatus = InvitationStatus.SENT
    created_at: datetime = Field(default_factory=now_utc)
    used_at: datetime | None = None


class TestAttempt(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    campaign_id: UUID
    test_invitation_id: UUID
    status: TestAttemptStatus = TestAttemptStatus.NOT_STARTED
    started_at: datetime | None = None
    submitted_at: datetime | None = None
    duration_seconds: int | None = None
    score: float | None = None
    max_score: float | None = None
    percentage: float | None = None
    answers: list[dict[str, Any]] = Field(default_factory=list)
    ai_feedback: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class InterviewInvitation(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    campaign_id: UUID
    token_hash: str
    expires_at: datetime
    status: InvitationStatus = InvitationStatus.SENT
    created_at: datetime = Field(default_factory=now_utc)
    used_at: datetime | None = None


class InterviewSession(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    campaign_id: UUID
    interview_invitation_id: UUID
    status: InterviewSessionStatus = InterviewSessionStatus.WAITING_ROOM
    started_at: datetime | None = None
    ended_at: datetime | None = None
    duration_seconds: int | None = None
    microphone_check_passed: bool | None = None
    network_grace_used: bool = False
    customer_sentiment: Sentiment = Sentiment.neutral
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class InterviewEvent(APIModel):
    id: UUID = Field(default_factory=uuid4)
    interview_session_id: UUID
    event_type: InterviewEventType
    speaker: Speaker | None = None
    text: str | None = None
    sentiment: Sentiment | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)


class InterviewReport(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID
    campaign_id: UUID
    interview_session_id: UUID
    transcript: list[dict[str, Any]] = Field(default_factory=list)
    radar_scores: dict[str, int] = Field(default_factory=dict)
    summary: str | None = None
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendation: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class EmailEvent(APIModel):
    id: UUID = Field(default_factory=uuid4)
    candidate_id: UUID | None = None
    campaign_id: UUID | None = None
    email_type: EmailType
    recipient_email: str
    subject: str
    body: str
    status: EmailEventStatus = EmailEventStatus.PREVIEW
    provider: str = "mock"
    provider_message_id: str | None = None
    error_message: str | None = None
    created_at: datetime = Field(default_factory=now_utc)
    sent_at: datetime | None = None

    @field_validator("recipient_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return validate_email_value(value)


class AuditLog(APIModel):
    id: UUID = Field(default_factory=uuid4)
    actor_id: UUID | None = None
    actor_email: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: UUID | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=now_utc)


class UserCreate(APIModel):
    name: str
    email: str
    role: UserRole = UserRole.HR_MANAGER
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return validate_email_value(value)


class MockLoginRequest(APIModel):
    email: str = "hr@hiretrain.ai"
    role: UserRole = UserRole.HR_MANAGER


class CampaignCreate(APIModel):
    title: str
    jd_text: str | None = None
    deadline_at: datetime | None = None
    created_by: UUID | None = None


class CampaignUpdate(APIModel):
    title: str | None = None
    jd_text: str | None = None
    status: CampaignStatus | None = None
    deadline_at: datetime | None = None


class RubricCriterionInput(APIModel):
    category: RubricCategory
    name: str
    weight: int = Field(ge=0, le=100)
    description: str | None = None


class RubricUpsertRequest(APIModel):
    criteria: list[RubricCriterionInput]


class TestQuestionInput(APIModel):
    question_text: str
    question_type: str = "multiple_choice"
    difficulty: str | None = None
    skill_tag: str | None = None
    options: list[dict[str, Any]] = Field(default_factory=list)
    correct_option_id: str | None = None
    explanation: str | None = None
    status: TestQuestionStatus = TestQuestionStatus.APPROVED
    order_index: int = 0


class GenerateTestQuestionsRequest(APIModel):
    count: int = Field(default=15, ge=10, le=20)


class TestQuestionUpsertRequest(APIModel):
    questions: list[TestQuestionInput]


class CandidateApplyRequest(APIModel):
    full_name: str
    email: str
    phone: str | None = None
    cv_text: str
    cv_file_name: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return validate_email_value(value)


class CandidateStatusUpdateRequest(APIModel):
    status: CandidateStatus
    reason: str | None = None
    actor_id: UUID | None = None


class CandidateCompareRequest(APIModel):
    candidate_ids: list[UUID] = Field(min_length=2, max_length=5)


class CandidateScoreRequest(APIModel):
    candidate_id: UUID | None = None


class BulkCandidateScoreRequest(APIModel):
    candidate_ids: list[UUID] | None = None


class TokenLinkResponse(APIModel):
    invitation_id: UUID
    candidate_id: UUID
    campaign_id: UUID
    token: str
    url: str
    expires_at: datetime
    email_event: EmailEvent


class TestOpenResponse(APIModel):
    candidate: Candidate
    campaign: Campaign
    invitation: TestInvitation
    questions: list[TestQuestion]
    duration_seconds: int = 1800


class TestStartResponse(APIModel):
    attempt: TestAttempt
    duration_seconds: int = 1800


class TestAnswerInput(APIModel):
    question_id: UUID
    selected_option_id: str | None = None


class TestSubmitRequest(APIModel):
    answers: list[TestAnswerInput]
    auto_submitted: bool = False
    duration_seconds: int | None = None


class InterviewCheckInRequest(APIModel):
    microphone_check_passed: bool
    permission_state: str | None = None
    test_recording_seconds: int | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class InterviewOpenResponse(APIModel):
    candidate: Candidate
    campaign: Campaign
    invitation: InterviewInvitation
    session: InterviewSession | None = None


class InterviewEventCreate(APIModel):
    event_type: InterviewEventType
    speaker: Speaker | None = None
    text: str | None = None
    sentiment: Sentiment | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class FinalDecisionRequest(APIModel):
    decision: str = Field(pattern="^(PASSED|REJECTED)$")
    reason: str | None = None
    actor_id: UUID | None = None


class BulkEmailRequest(APIModel):
    candidate_ids: list[UUID] = Field(min_length=1)
    secure_password: str
    actor_email: str | None = None


class FinalReviewResponse(APIModel):
    candidate: Candidate
    cv_score: CandidateScore | None = None
    test_attempt: TestAttempt | None = None
    interview_report: InterviewReport | None = None
    current_status: CandidateStatus
    final_decision: str | None = None


class HealthResponse(APIModel):
    status: str
    app_env: str
    storage_provider: str
    database_connected: bool
    ai_provider: str
    interview_provider: str
    email_provider: str

