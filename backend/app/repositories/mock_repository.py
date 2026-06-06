from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from app.core.mock_quicktest import mock_quicktest_questions
from app.schemas.module1 import (
    AuditLog,
    Campaign,
    CampaignStatus,
    Candidate,
    CandidateBadge,
    CandidateScore,
    CandidateStageEvent,
    CandidateStatus,
    EmailEvent,
    EmailEventStatus,
    EmailType,
    InterviewEvent,
    InterviewInvitation,
    InterviewReport,
    InterviewSession,
    InterviewSessionStatus,
    InvitationStatus,
    RubricCategory,
    RubricCriterion,
    TestAttempt,
    TestAttemptStatus,
    TestInvitation,
    TestQuestion,
    TestQuestionStatus,
    User,
    UserRole,
    now_utc,
)


class MockRepository:
    def __init__(self) -> None:
        self.users: dict[UUID, User] = {}
        self.campaigns: dict[UUID, Campaign] = {}
        self.rubric_criteria: dict[UUID, RubricCriterion] = {}
        self.test_questions: dict[UUID, TestQuestion] = {}
        self.candidates: dict[UUID, Candidate] = {}
        self.candidate_scores: dict[UUID, CandidateScore] = {}
        self.stage_events: dict[UUID, CandidateStageEvent] = {}
        self.test_invitations: dict[UUID, TestInvitation] = {}
        self.test_attempts: dict[UUID, TestAttempt] = {}
        self.interview_invitations: dict[UUID, InterviewInvitation] = {}
        self.interview_sessions: dict[UUID, InterviewSession] = {}
        self.interview_events: dict[UUID, InterviewEvent] = {}
        self.interview_reports: dict[UUID, InterviewReport] = {}
        self.email_events: dict[UUID, EmailEvent] = {}
        self.audit_logs: dict[UUID, AuditLog] = {}
        self.secure_failures: dict[str, int] = {}
        self.seed()

    def check_connection(self) -> bool:
        return False

    def seed(self) -> None:
        admin = User(name="Demo Admin", email="admin@hiretrain.ai", role=UserRole.ADMIN)
        hr = User(name="Demo HR Manager", email="hr@hiretrain.ai", role=UserRole.HR_MANAGER)
        self.users[admin.id] = admin
        self.users[hr.id] = hr

        jd = (
            "SHB tuyen Chuyen vien Quan he Khach hang doanh nghiep. Ung vien can co ky nang phan tich bao cao tai chinh, "
            "tham dinh tin dung, danh gia tai san bao dam, nhan dien rui ro no xau va tuan thu quy trinh bao mat thong tin. "
            "Vong 2 Quicktest tap trung vao hard skills trong nghiep vu ngan hang, khong su dung cau hoi ky nang mem."
        )
        campaign = Campaign(
            title="SHB Chuyen vien Quan he Khach hang - Quicktest Mock",
            jd_text=jd,
            status=CampaignStatus.ACTIVE,
            public_token="mock-shb-qhkh",
            created_by=hr.id,
        )
        self.campaigns[campaign.id] = campaign
        self.replace_rubric(
            campaign.id,
            [
                RubricCriterion(campaign_id=campaign.id, category=RubricCategory.hard_skill, name="Phan tich bao cao tai chinh", weight=30, description="Doc hieu dong tien, don bay va kha nang tra no."),
                RubricCriterion(campaign_id=campaign.id, category=RubricCategory.hard_skill, name="Tham dinh tin dung", weight=30, description="Kiem tra muc dich vay, ho so va phuong an tra no."),
                RubricCriterion(campaign_id=campaign.id, category=RubricCategory.hard_skill, name="Tai san bao dam", weight=20, description="Danh gia gia tri, phap ly va thanh khoan cua tai san."),
                RubricCriterion(campaign_id=campaign.id, category=RubricCategory.hard_skill, name="Nhan dien rui ro va bao mat", weight=20, description="Nhan dien rui ro no xau va bao ve thong tin khach hang."),
            ],
        )
        self.replace_test_questions(campaign.id, mock_quicktest_questions(campaign.id, campaign.title, campaign.jd_text, 12))

        candidate = Candidate(
            campaign_id=campaign.id,
            full_name="Nguyen Minh Anh",
            email="quicktest.demo@example.com",
            phone="0900000001",
            cv_text="Quan he khach hang doanh nghiep voi kinh nghiem phan tich bao cao tai chinh, tham dinh tin dung, tai san bao dam va quan tri rui ro.",
            cv_file_name="nguyen_minh_anh.pdf",
            status=CandidateStatus.CV_SCORED,
        )
        self.candidates[candidate.id] = candidate
        self.save_candidate_score(
            CandidateScore(
                candidate_id=candidate.id,
                campaign_id=campaign.id,
                score=86,
                badge=CandidateBadge.STRONG,
                ai_reasoning="Mock round 1 score: CV shows relevant credit analysis, collateral review and banking risk experience.",
                score_breakdown={"hard_skills": 86, "risk_control": 84},
                risk_flags=[],
            )
        )
        self.create_stage_event(
            CandidateStageEvent(
                candidate_id=candidate.id,
                campaign_id=campaign.id,
                from_status=CandidateStatus.APPLIED,
                to_status=CandidateStatus.CV_SCORED,
                reason="Mock candidate passed round 1 CV screening.",
                actor_id=hr.id,
                metadata={"source": "hackathon_seed"},
            )
        )
        self._seed_mock_data(campaign.id)

    def _seed_mock_data(self, campaign_id: UUID):
        self.create_audit_log(
            action="MOCK_SEED_CREATED",
            entity_type="campaign",
            entity_id=campaign_id,
            metadata={"mode": "hackathon_quicktest", "test_questions": 12},
            actor_email="system@hiretrain.ai",
        )

    def list_users(self) -> list[User]:
        return list(self.users.values())

    def create_user(self, user: User) -> User:
        if any(existing.email == user.email for existing in self.users.values()):
            raise ValueError("User email already exists.")
        self.users[user.id] = user
        return user

    def list_audit_logs(self) -> list[AuditLog]:
        return sorted(self.audit_logs.values(), key=lambda log: log.created_at, reverse=True)

    def create_campaign(self, campaign: Campaign) -> Campaign:
        self.campaigns[campaign.id] = campaign
        return campaign

    def list_campaigns(self) -> list[Campaign]:
        return sorted(self.campaigns.values(), key=lambda campaign: campaign.created_at, reverse=True)

    def get_campaign(self, campaign_id: UUID) -> Campaign | None:
        return self.campaigns.get(campaign_id)

    def update_campaign(self, campaign_id: UUID, data: dict[str, Any]) -> Campaign | None:
        campaign = self.get_campaign(campaign_id)
        if not campaign:
            return None
        update_data = {key: value for key, value in data.items() if value is not None}
        update_data["updated_at"] = now_utc()
        campaign = campaign.model_copy(update=update_data)
        self.campaigns[campaign_id] = campaign
        return campaign

    def list_rubric(self, campaign_id: UUID) -> list[RubricCriterion]:
        return [item for item in self.rubric_criteria.values() if item.campaign_id == campaign_id]

    def replace_rubric(self, campaign_id: UUID, criteria: list[RubricCriterion]) -> list[RubricCriterion]:
        for item_id in [item.id for item in self.list_rubric(campaign_id)]:
            del self.rubric_criteria[item_id]
        for item in criteria:
            self.rubric_criteria[item.id] = item
        return criteria

    def list_test_questions(self, campaign_id: UUID, published_only: bool = False) -> list[TestQuestion]:
        questions = [item for item in self.test_questions.values() if item.campaign_id == campaign_id]
        if published_only:
            questions = [item for item in questions if item.status == TestQuestionStatus.PUBLISHED]
        return sorted(questions, key=lambda item: item.order_index)

    def replace_test_questions(self, campaign_id: UUID, questions: list[TestQuestion]) -> list[TestQuestion]:
        for item_id in [item.id for item in self.list_test_questions(campaign_id)]:
            del self.test_questions[item_id]
        for item in questions:
            self.test_questions[item.id] = item
        return questions

    def publish_test_questions(self, campaign_id: UUID) -> list[TestQuestion]:
        published: list[TestQuestion] = []
        for question in self.list_test_questions(campaign_id):
            updated = question.model_copy(update={"status": TestQuestionStatus.PUBLISHED, "updated_at": now_utc()})
            self.test_questions[question.id] = updated
            published.append(updated)
        return published

    def create_candidate(self, candidate: Candidate) -> Candidate:
        if self.get_candidate_by_email(candidate.campaign_id, candidate.email):
            raise ValueError("Candidate already applied to this campaign.")
        self.candidates[candidate.id] = candidate
        return candidate

    def list_candidates(self, campaign_id: UUID | None = None) -> list[Candidate]:
        candidates = list(self.candidates.values())
        if campaign_id:
            candidates = [candidate for candidate in candidates if candidate.campaign_id == campaign_id]
        return sorted(candidates, key=lambda candidate: candidate.created_at, reverse=True)

    def get_candidate(self, candidate_id: UUID) -> Candidate | None:
        return self.candidates.get(candidate_id)

    def get_candidate_by_email(self, campaign_id: UUID, email: str) -> Candidate | None:
        email = email.lower().strip()
        return next((item for item in self.candidates.values() if item.campaign_id == campaign_id and item.email == email), None)

    def update_candidate(self, candidate_id: UUID, data: dict[str, Any]) -> Candidate | None:
        candidate = self.get_candidate(candidate_id)
        if not candidate:
            return None
        update_data = {key: value for key, value in data.items() if value is not None}
        update_data["updated_at"] = now_utc()
        candidate = candidate.model_copy(update=update_data)
        self.candidates[candidate_id] = candidate
        return candidate

    def save_candidate_score(self, score: CandidateScore) -> CandidateScore:
        for score_id, existing in list(self.candidate_scores.items()):
            if existing.candidate_id == score.candidate_id:
                del self.candidate_scores[score_id]
        self.candidate_scores[score.id] = score
        return score

    def get_candidate_score(self, candidate_id: UUID) -> CandidateScore | None:
        return next((item for item in self.candidate_scores.values() if item.candidate_id == candidate_id), None)

    def list_candidate_scores(self, campaign_id: UUID) -> list[CandidateScore]:
        return [item for item in self.candidate_scores.values() if item.campaign_id == campaign_id]

    def create_stage_event(self, event: CandidateStageEvent) -> CandidateStageEvent:
        self.stage_events[event.id] = event
        return event

    def create_test_invitation(self, invitation: TestInvitation) -> TestInvitation:
        self.test_invitations[invitation.id] = invitation
        return invitation

    def get_test_invitation_by_hash(self, token_hash: str) -> TestInvitation | None:
        return next((item for item in self.test_invitations.values() if item.token_hash == token_hash), None)

    def update_test_invitation(self, invitation_id: UUID, data: dict[str, Any]) -> TestInvitation | None:
        invitation = self.test_invitations.get(invitation_id)
        if not invitation:
            return None
        updated = invitation.model_copy(update=data)
        self.test_invitations[invitation_id] = updated
        return updated

    def get_attempt_by_invitation(self, invitation_id: UUID) -> TestAttempt | None:
        return next((item for item in self.test_attempts.values() if item.test_invitation_id == invitation_id), None)

    def get_latest_attempt(self, candidate_id: UUID) -> TestAttempt | None:
        attempts = [item for item in self.test_attempts.values() if item.candidate_id == candidate_id]
        return max(attempts, key=lambda item: item.created_at) if attempts else None

    def save_test_attempt(self, attempt: TestAttempt) -> TestAttempt:
        self.test_attempts[attempt.id] = attempt
        return attempt

    def create_interview_invitation(self, invitation: InterviewInvitation) -> InterviewInvitation:
        self.interview_invitations[invitation.id] = invitation
        return invitation

    def get_interview_invitation_by_hash(self, token_hash: str) -> InterviewInvitation | None:
        return next((item for item in self.interview_invitations.values() if item.token_hash == token_hash), None)

    def update_interview_invitation(self, invitation_id: UUID, data: dict[str, Any]) -> InterviewInvitation | None:
        invitation = self.interview_invitations.get(invitation_id)
        if not invitation:
            return None
        updated = invitation.model_copy(update=data)
        self.interview_invitations[invitation_id] = updated
        return updated

    def get_interview_session_by_invitation(self, invitation_id: UUID) -> InterviewSession | None:
        return next((item for item in self.interview_sessions.values() if item.interview_invitation_id == invitation_id), None)

    def get_latest_interview_session(self, candidate_id: UUID) -> InterviewSession | None:
        sessions = [item for item in self.interview_sessions.values() if item.candidate_id == candidate_id]
        return max(sessions, key=lambda item: item.created_at) if sessions else None

    def save_interview_session(self, session: InterviewSession) -> InterviewSession:
        self.interview_sessions[session.id] = session
        return session

    def create_interview_event(self, event: InterviewEvent) -> InterviewEvent:
        self.interview_events[event.id] = event
        return event

    def list_interview_events(self, session_id: UUID) -> list[InterviewEvent]:
        events = [item for item in self.interview_events.values() if item.interview_session_id == session_id]
        return sorted(events, key=lambda item: item.created_at)

    def save_interview_report(self, report: InterviewReport) -> InterviewReport:
        for report_id, existing in list(self.interview_reports.items()):
            if existing.interview_session_id == report.interview_session_id:
                del self.interview_reports[report_id]
        self.interview_reports[report.id] = report
        return report

    def get_interview_report(self, candidate_id: UUID) -> InterviewReport | None:
        return next((item for item in self.interview_reports.values() if item.candidate_id == candidate_id), None)

    def create_email_event(self, event: EmailEvent) -> EmailEvent:
        self.email_events[event.id] = event
        return event

    def list_email_events(self, campaign_id: UUID | None = None) -> list[EmailEvent]:
        events = list(self.email_events.values())
        if campaign_id:
            events = [item for item in events if item.campaign_id == campaign_id]
        return sorted(events, key=lambda item: item.created_at, reverse=True)

    def create_audit_log(
        self,
        action: str,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
        actor_id: UUID | None = None,
        actor_email: str | None = None,
    ) -> AuditLog:
        log = AuditLog(
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata or {},
        )
        self.audit_logs[log.id] = log
        return log
