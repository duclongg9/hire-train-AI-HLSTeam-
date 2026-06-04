from __future__ import annotations

from datetime import timedelta
from typing import Any
from uuid import UUID

from config import settings
from app.core.errors import AppError
from app.core.security import validate_secure_password
from app.core.tokens import generate_raw_token, hash_token
from app.repositories.factory import get_repository
from app.schemas.module1 import (
    BulkEmailRequest,
    Campaign,
    CampaignCreate,
    CampaignStatus,
    CampaignUpdate,
    Candidate,
    CandidateApplyRequest,
    CandidateCompareRequest,
    CandidateScore,
    CandidateStageEvent,
    CandidateStatus,
    CandidateStatusUpdateRequest,
    EmailEvent,
    EmailType,
    InterviewReport,
    FinalDecisionRequest,
    FinalReviewResponse,
    GenerateTestQuestionsRequest,
    InterviewCheckInRequest,
    InterviewEvent,
    InterviewEventCreate,
    InterviewInvitation,
    InterviewOpenResponse,
    InterviewSession,
    InterviewSessionStatus,
    InvitationStatus,
    MockLoginRequest,
    RubricCriterion,
    RubricUpsertRequest,
    TestAttempt,
    TestAttemptStatus,
    TestInvitation,
    TestOpenResponse,
    TestQuestion,
    TestQuestionStatus,
    TestQuestionUpsertRequest,
    TestStartResponse,
    TestSubmitRequest,
    TokenLinkResponse,
    User,
    UserCreate,
    UserRole,
    now_utc,
)
from app.services.ai import get_ai_provider
from app.services.email import get_email_provider
from app.services.interview import get_interview_provider


class Module1Service:
    def __init__(self):
        self.repo = get_repository()
        self.ai = get_ai_provider()
        self.email = get_email_provider()
        self.interview = get_interview_provider()

    def check_database(self) -> bool:
        return self.repo.check_connection()

    def _campaign_or_404(self, campaign_id: UUID) -> Campaign:
        campaign = self.repo.get_campaign(campaign_id)
        if not campaign:
            raise AppError(404, "Campaign not found.")
        return campaign

    def _candidate_or_404(self, candidate_id: UUID) -> Candidate:
        candidate = self.repo.get_candidate(candidate_id)
        if not candidate:
            raise AppError(404, "Candidate not found.")
        return candidate

    def _rubric_or_error(self, campaign_id: UUID) -> list[RubricCriterion]:
        rubric = self.repo.list_rubric(campaign_id)
        if not rubric:
            raise AppError(400, "Campaign rubric is required for this action.")
        return rubric

    def _valid_test_invitation(self, token: str) -> TestInvitation:
        invitation = self.repo.get_test_invitation_by_hash(hash_token(token))
        if not invitation:
            raise AppError(404, "Invalid test token.")
        if invitation.expires_at < now_utc():
            self.repo.update_test_invitation(invitation.id, {"status": InvitationStatus.EXPIRED})
            raise AppError(410, "Test token has expired.")
        return invitation

    def _valid_interview_invitation(self, token: str) -> InterviewInvitation:
        invitation = self.repo.get_interview_invitation_by_hash(hash_token(token))
        if not invitation:
            raise AppError(404, "Invalid interview token.")
        if invitation.expires_at < now_utc():
            self.repo.update_interview_invitation(invitation.id, {"status": InvitationStatus.EXPIRED})
            raise AppError(410, "Interview token has expired.")
        return invitation

    def _transition_candidate(
        self,
        candidate: Candidate,
        to_status: CandidateStatus,
        reason: str | None = None,
        actor_id: UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Candidate:
        from_status = candidate.status
        updated = self.repo.update_candidate(candidate.id, {"status": to_status})
        if not updated:
            raise AppError(404, "Candidate not found.")
        self.repo.create_stage_event(
            CandidateStageEvent(
                candidate_id=candidate.id,
                campaign_id=candidate.campaign_id,
                from_status=from_status,
                to_status=to_status,
                reason=reason,
                actor_id=actor_id,
                metadata=metadata or {},
            )
        )
        return updated

    def mock_login(self, payload: MockLoginRequest) -> dict[str, Any]:
        users = self.repo.list_users()
        user = next((item for item in users if item.email == payload.email.lower()), None)
        if not user:
            user = self.repo.create_user(User(name="Demo User", email=payload.email, role=payload.role))
        self.repo.create_audit_log("MOCK_LOGIN", "user", user.id, {"role": user.role}, actor_email=user.email)
        return {"access_token": f"mock-token-{user.id}", "token_type": "bearer", "user": user}

    def list_users(self) -> list[User]:
        return self.repo.list_users()

    def create_user(self, payload: UserCreate) -> User:
        user = self.repo.create_user(User(**payload.model_dump()))
        self.repo.create_audit_log("USER_CREATED", "user", user.id, actor_email=user.email)
        return user

    def list_audit_logs(self):
        return self.repo.list_audit_logs()

    def list_campaigns(self) -> list[Campaign]:
        return self.repo.list_campaigns()

    def create_campaign(self, payload: CampaignCreate) -> Campaign:
        campaign = self.repo.create_campaign(Campaign(**payload.model_dump()))
        self.repo.create_audit_log("CAMPAIGN_CREATED", "campaign", campaign.id, actor_id=campaign.created_by)
        return campaign

    def get_campaign(self, campaign_id: UUID) -> Campaign:
        return self._campaign_or_404(campaign_id)

    def update_campaign(self, campaign_id: UUID, payload: CampaignUpdate) -> Campaign:
        self._campaign_or_404(campaign_id)
        campaign = self.repo.update_campaign(campaign_id, payload.model_dump(exclude_unset=True))
        self.repo.create_audit_log("CAMPAIGN_UPDATED", "campaign", campaign_id)
        return campaign

    def analyze_jd(self, campaign_id: UUID) -> list[RubricCriterion]:
        campaign = self._campaign_or_404(campaign_id)
        if not campaign.jd_text or len(campaign.jd_text.strip()) < 100:
            raise AppError(400, "JD must be at least 100 characters before AI analysis.")
        criteria = self.ai.analyze_jd(campaign.id, campaign.jd_text)
        saved = self.repo.replace_rubric(campaign.id, criteria)
        self.repo.create_audit_log("JD_ANALYZED", "campaign", campaign.id, {"criteria_count": len(saved)})
        return saved

    def upsert_rubric(self, campaign_id: UUID, payload: RubricUpsertRequest) -> list[RubricCriterion]:
        self._campaign_or_404(campaign_id)
        total = sum(item.weight for item in payload.criteria)
        if total != 100:
            raise AppError(400, "Rubric total weight must equal 100.")
        criteria = [RubricCriterion(campaign_id=campaign_id, **item.model_dump()) for item in payload.criteria]
        saved = self.repo.replace_rubric(campaign_id, criteria)
        self.repo.create_audit_log("RUBRIC_SAVED", "campaign", campaign_id, {"total_weight": total})
        return saved

    def publish_campaign(self, campaign_id: UUID) -> Campaign:
        campaign = self._campaign_or_404(campaign_id)
        if not self.repo.list_rubric(campaign_id):
            raise AppError(400, "Rubric must exist before publishing campaign.")
        public_token = campaign.public_token or generate_raw_token()
        updated = self.repo.update_campaign(campaign_id, {"status": CampaignStatus.ACTIVE, "public_token": public_token})
        self.repo.create_audit_log("CAMPAIGN_PUBLISHED", "campaign", campaign_id)
        return updated

    def generate_test_questions(self, campaign_id: UUID, payload: GenerateTestQuestionsRequest) -> list[TestQuestion]:
        campaign = self._campaign_or_404(campaign_id)
        rubric = self._rubric_or_error(campaign_id)
        questions = self.ai.generate_test_questions(campaign_id, campaign.jd_text or "", rubric, payload.count)
        saved = self.repo.replace_test_questions(campaign_id, questions)
        self.repo.create_audit_log("TEST_QUESTIONS_GENERATED", "campaign", campaign_id, {"count": len(saved)})
        return saved

    def list_test_questions(self, campaign_id: UUID) -> list[TestQuestion]:
        self._campaign_or_404(campaign_id)
        return self.repo.list_test_questions(campaign_id)

    def upsert_test_questions(self, campaign_id: UUID, payload: TestQuestionUpsertRequest) -> list[TestQuestion]:
        self._campaign_or_404(campaign_id)
        questions = [TestQuestion(campaign_id=campaign_id, **item.model_dump()) for item in payload.questions]
        if not 10 <= len(questions) <= 20:
            raise AppError(400, "Professional test must contain 10-20 questions.")
        saved = self.repo.replace_test_questions(campaign_id, questions)
        self.repo.create_audit_log("TEST_QUESTIONS_SAVED", "campaign", campaign_id, {"count": len(saved)})
        return saved

    def publish_test_questions(self, campaign_id: UUID) -> list[TestQuestion]:
        questions = self.repo.list_test_questions(campaign_id)
        if not questions:
            raise AppError(400, "Test questions must exist before publishing.")
        if not 10 <= len(questions) <= 20:
            raise AppError(400, "Professional test must contain 10-20 questions.")
        published = self.repo.publish_test_questions(campaign_id)
        self.repo.create_audit_log("TEST_QUESTIONS_PUBLISHED", "campaign", campaign_id, {"count": len(published)})
        return published

    def get_public_job(self, campaign_id: UUID) -> Campaign:
        campaign = self._campaign_or_404(campaign_id)
        if campaign.status != CampaignStatus.ACTIVE:
            raise AppError(404, "Public job is not active.")
        return campaign

    def apply_candidate(self, campaign_id: UUID, payload: CandidateApplyRequest) -> Candidate:
        campaign = self.get_public_job(campaign_id)
        if self.repo.get_candidate_by_email(campaign.id, payload.email):
            raise AppError(409, "Candidate email already applied to this campaign.")
        candidate = self.repo.create_candidate(Candidate(campaign_id=campaign.id, **payload.model_dump()))
        self.repo.create_audit_log("CANDIDATE_APPLIED", "candidate", candidate.id, {"campaign_id": str(campaign.id)})
        return candidate

    def apply_candidate_file(self, campaign_id: UUID, file_bytes: bytes, file_name: str) -> Candidate:
        from app.core.document_parser import extract_text_from_pdf, extract_text_from_docx
        
        # Extract text based on extension
        ext = file_name.split(".")[-1].lower()
        if ext == "pdf":
            cv_text = extract_text_from_pdf(file_bytes)
        elif ext in ("docx", "doc"):
            cv_text = extract_text_from_docx(file_bytes)
        else:
            raise AppError(400, "Unsupported CV file format. Only PDF and DOCX are supported.")
            
        if not cv_text.strip():
            raise AppError(400, "Could not extract text from CV file. The file might be empty or scanned as image.")
            
        # Extract details using Gemini
        info = self.ai.extract_candidate_info(cv_text)
        
        full_name = info.get("full_name") or file_name.split("/")[-1].replace(f".{ext}", "")
        email = info.get("email")
        phone = info.get("phone")
        
        # Fallback regex email parsing in case AI failed or returned null
        if not email:
            import re
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text)
            if email_match:
                email = email_match.group(0)
            else:
                email = f"{full_name.lower().replace(' ', '.')}@example.com"
                
        payload = CandidateApplyRequest(
            full_name=full_name,
            email=email,
            phone=phone,
            cv_text=cv_text,
            cv_file_name=file_name,
        )
        return self.apply_candidate(campaign_id, payload)

    def list_candidates(self, campaign_id: UUID) -> list[Candidate]:
        self._campaign_or_404(campaign_id)
        return self.repo.list_candidates(campaign_id)

    def get_candidate(self, candidate_id: UUID) -> Candidate:
        return self._candidate_or_404(candidate_id)

    def leaderboard(self, campaign_id: UUID) -> list[dict[str, Any]]:
        self._campaign_or_404(campaign_id)
        candidates = self.repo.list_candidates(campaign_id)
        rows = []
        for candidate in candidates:
            score = self.repo.get_candidate_score(candidate.id)
            rows.append({"candidate": candidate, "score": score})
        return sorted(rows, key=lambda row: row["score"].score if row["score"] else -1, reverse=True)

    def score_candidate(self, campaign_id: UUID, candidate_id: UUID) -> CandidateScore:
        self._campaign_or_404(campaign_id)
        rubric = self._rubric_or_error(campaign_id)
        candidate = self._candidate_or_404(candidate_id)
        if candidate.campaign_id != campaign_id:
            raise AppError(400, "Candidate does not belong to this campaign.")
        score = self.ai.score_candidate(candidate, rubric)
        saved = self.repo.save_candidate_score(score)
        self._transition_candidate(candidate, CandidateStatus.CV_SCORED, "CV scored by AI")
        self.repo.create_audit_log("CANDIDATE_SCORED", "candidate", candidate.id, {"score": saved.score})
        return saved

    def bulk_score_candidates(self, campaign_id: UUID, candidate_ids: list[UUID] | None = None) -> list[CandidateScore]:
        candidates = self.repo.list_candidates(campaign_id)
        if candidate_ids:
            wanted = set(candidate_ids)
            candidates = [item for item in candidates if item.id in wanted]
        return [self.score_candidate(campaign_id, item.id) for item in candidates]

    def update_candidate_status(self, candidate_id: UUID, payload: CandidateStatusUpdateRequest) -> Candidate:
        candidate = self._candidate_or_404(candidate_id)
        return self._transition_candidate(candidate, payload.status, payload.reason, payload.actor_id)

    def compare_candidates(self, campaign_id: UUID, payload: CandidateCompareRequest) -> list[FinalReviewResponse]:
        return [self.final_review(candidate_id) for candidate_id in payload.candidate_ids]

    def invite_test(self, candidate_id: UUID) -> TokenLinkResponse:
        candidate = self._candidate_or_404(candidate_id)
        questions = self.repo.list_test_questions(candidate.campaign_id, published_only=True)
        if not questions:
            raise AppError(400, "Published test questions are required before test invitation.")
        raw_token = generate_raw_token()
        invitation = self.repo.create_test_invitation(
            TestInvitation(
                candidate_id=candidate.id,
                campaign_id=candidate.campaign_id,
                token_hash=hash_token(raw_token),
                expires_at=now_utc() + timedelta(hours=settings.CANDIDATE_LINK_TTL_HOURS),
            )
        )
        event = self.email.send(
            EmailEvent(
                candidate_id=candidate.id,
                campaign_id=candidate.campaign_id,
                email_type=EmailType.TEST_INVITATION,
                recipient_email=candidate.email,
                subject="Your HireTrain AI professional test invitation",
                body=f"Open your professional test link: /api/candidate/test/{raw_token}",
            )
        )
        saved_event = self.repo.create_email_event(event)
        self._transition_candidate(candidate, CandidateStatus.TEST_INVITED, "Test invitation sent", metadata={"invitation_id": str(invitation.id)})
        return TokenLinkResponse(invitation_id=invitation.id, candidate_id=candidate.id, campaign_id=candidate.campaign_id, token=raw_token, url=f"/api/candidate/test/{raw_token}", expires_at=invitation.expires_at, email_event=saved_event)

    def open_test(self, token: str) -> TestOpenResponse:
        invitation = self._valid_test_invitation(token)
        self.repo.update_test_invitation(invitation.id, {"status": InvitationStatus.OPENED})
        candidate = self._candidate_or_404(invitation.candidate_id)
        campaign = self._campaign_or_404(invitation.campaign_id)
        questions = self.repo.list_test_questions(campaign.id, published_only=True)
        return TestOpenResponse(candidate=candidate, campaign=campaign, invitation=invitation, questions=questions)

    def start_test(self, token: str) -> TestStartResponse:
        invitation = self._valid_test_invitation(token)
        attempt = self.repo.get_attempt_by_invitation(invitation.id)
        if attempt and attempt.status not in [TestAttemptStatus.NOT_STARTED, TestAttemptStatus.IN_PROGRESS]:
            raise AppError(409, "Test attempt has already been submitted.")
        if not attempt:
            attempt = TestAttempt(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, test_invitation_id=invitation.id, status=TestAttemptStatus.IN_PROGRESS, started_at=now_utc())
        else:
            attempt = attempt.model_copy(update={"status": TestAttemptStatus.IN_PROGRESS, "started_at": attempt.started_at or now_utc(), "updated_at": now_utc()})
        saved = self.repo.save_test_attempt(attempt)
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.TEST_IN_PROGRESS, "Candidate started test")
        return TestStartResponse(attempt=saved)

    def submit_test(self, token: str, payload: TestSubmitRequest) -> TestAttempt:
        invitation = self._valid_test_invitation(token)
        attempt = self.repo.get_attempt_by_invitation(invitation.id)
        if attempt and attempt.status in [TestAttemptStatus.SUBMITTED, TestAttemptStatus.AUTO_SUBMITTED, TestAttemptStatus.SCORED]:
            raise AppError(409, "Candidate cannot submit test twice for same invitation.")
        if not attempt:
            attempt = TestAttempt(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, test_invitation_id=invitation.id, status=TestAttemptStatus.IN_PROGRESS, started_at=now_utc())
        questions = self.repo.list_test_questions(invitation.campaign_id, published_only=True)
        answers = [item.model_dump(mode="json") for item in payload.answers]
        result = self.ai.score_test_attempt(answers, questions)
        status = TestAttemptStatus.AUTO_SUBMITTED if payload.auto_submitted else TestAttemptStatus.SCORED
        updated = attempt.model_copy(update={
            "status": status,
            "submitted_at": now_utc(),
            "duration_seconds": payload.duration_seconds,
            **result,
            "updated_at": now_utc(),
        })
        saved = self.repo.save_test_attempt(updated)
        self.repo.update_test_invitation(invitation.id, {"status": InvitationStatus.USED, "used_at": now_utc()})
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.TEST_COMPLETED, "Candidate submitted professional test", metadata={"percentage": saved.percentage})
        return saved

    def test_result(self, token: str) -> TestAttempt:
        invitation = self._valid_test_invitation(token)
        attempt = self.repo.get_attempt_by_invitation(invitation.id)
        if not attempt:
            raise AppError(404, "No test attempt found.")
        return attempt

    def invite_interview(self, candidate_id: UUID) -> TokenLinkResponse:
        candidate = self._candidate_or_404(candidate_id)
        raw_token = generate_raw_token()
        invitation = self.repo.create_interview_invitation(
            InterviewInvitation(
                candidate_id=candidate.id,
                campaign_id=candidate.campaign_id,
                token_hash=hash_token(raw_token),
                expires_at=now_utc() + timedelta(hours=settings.CANDIDATE_LINK_TTL_HOURS),
            )
        )
        event = self.email.send(
            EmailEvent(
                candidate_id=candidate.id,
                campaign_id=candidate.campaign_id,
                email_type=EmailType.INTERVIEW_INVITATION,
                recipient_email=candidate.email,
                subject="Your HireTrain AI virtual interview invitation",
                body=f"Open your virtual interview link: /api/candidate/interview/{raw_token}",
            )
        )
        saved_event = self.repo.create_email_event(event)
        self._transition_candidate(candidate, CandidateStatus.INTERVIEW_INVITED, "Interview invitation sent", metadata={"invitation_id": str(invitation.id)})
        return TokenLinkResponse(invitation_id=invitation.id, candidate_id=candidate.id, campaign_id=candidate.campaign_id, token=raw_token, url=f"/api/candidate/interview/{raw_token}", expires_at=invitation.expires_at, email_event=saved_event)

    def open_interview(self, token: str) -> InterviewOpenResponse:
        invitation = self._valid_interview_invitation(token)
        self.repo.update_interview_invitation(invitation.id, {"status": InvitationStatus.OPENED})
        candidate = self._candidate_or_404(invitation.candidate_id)
        campaign = self._campaign_or_404(invitation.campaign_id)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        return InterviewOpenResponse(candidate=candidate, campaign=campaign, invitation=invitation, session=session)

    def check_in_interview(self, token: str, payload: InterviewCheckInRequest) -> InterviewSession:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        metadata = {**payload.metadata, "permission_state": payload.permission_state, "test_recording_seconds": payload.test_recording_seconds}
        if not session:
            session = InterviewSession(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, interview_invitation_id=invitation.id)
        session = session.model_copy(update={"status": InterviewSessionStatus.READY, "microphone_check_passed": payload.microphone_check_passed, "metadata": metadata, "updated_at": now_utc()})
        return self.repo.save_interview_session(session)

    def start_interview(self, token: str) -> dict[str, Any]:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        if not session:
            session = InterviewSession(candidate_id=invitation.candidate_id, campaign_id=invitation.campaign_id, interview_invitation_id=invitation.id)
        session = session.model_copy(update={"status": InterviewSessionStatus.IN_PROGRESS, "started_at": session.started_at or now_utc(), "updated_at": now_utc()})
        saved = self.repo.save_interview_session(session)
        self.repo.update_interview_invitation(invitation.id, {"status": InvitationStatus.USED, "used_at": now_utc()})
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.INTERVIEW_IN_PROGRESS, "Candidate started interview")
        return {"session": saved, "provider": self.interview.start_session(saved)}

    def ingest_interview_event(self, token: str, payload: InterviewEventCreate) -> dict[str, Any]:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        if not session or session.status != InterviewSessionStatus.IN_PROGRESS:
            raise AppError(400, "Interview session must be in progress before events can be sent.")
        event = self.repo.create_interview_event(InterviewEvent(interview_session_id=session.id, **payload.model_dump()))
        provider_result = self.interview.ingest_event(session, event)
        if provider_result.get("customer_sentiment"):
            session = session.model_copy(update={"customer_sentiment": provider_result["customer_sentiment"], "updated_at": now_utc()})
            self.repo.save_interview_session(session)
        ai_reply = provider_result.get("reply")
        ai_event = None
        if ai_reply:
            ai_event = self.repo.create_interview_event(InterviewEvent(interview_session_id=session.id, event_type="ai_speech", speaker="ai", text=ai_reply, sentiment=session.customer_sentiment))
        return {"event": event, "ai_event": ai_event, "provider": provider_result}

    def finish_interview(self, token: str) -> InterviewReport:
        invitation = self._valid_interview_invitation(token)
        session = self.repo.get_interview_session_by_invitation(invitation.id)
        if not session or session.status != InterviewSessionStatus.IN_PROGRESS:
            raise AppError(400, "Candidate cannot finish interview before it starts.")
        ended_at = now_utc()
        duration = int((ended_at - (session.started_at or ended_at)).total_seconds())
        self.repo.create_interview_event(InterviewEvent(interview_session_id=session.id, event_type="session_finished", speaker="system", text="Interview session finished."))
        events = self.repo.list_interview_events(session.id)
        self.interview.finish_session(session, events)
        completed = session.model_copy(update={"status": InterviewSessionStatus.COMPLETED, "ended_at": ended_at, "duration_seconds": duration, "updated_at": ended_at})
        self.repo.save_interview_session(completed)
        report = self.ai.generate_interview_report(completed, events)
        saved_report = self.repo.save_interview_report(report)
        candidate = self._candidate_or_404(invitation.candidate_id)
        self._transition_candidate(candidate, CandidateStatus.INTERVIEW_COMPLETED, "Interview completed and report generated")
        return saved_report

    def interview_report(self, candidate_id: UUID) -> InterviewReport:
        self._candidate_or_404(candidate_id)
        report = self.repo.get_interview_report(candidate_id)
        if not report:
            raise AppError(404, "Interview report not found.")
        return report

    def final_review(self, candidate_id: UUID) -> FinalReviewResponse:
        candidate = self._candidate_or_404(candidate_id)
        return FinalReviewResponse(
            candidate=candidate,
            cv_score=self.repo.get_candidate_score(candidate.id),
            test_attempt=self.repo.get_latest_attempt(candidate.id),
            interview_report=self.repo.get_interview_report(candidate.id),
            current_status=candidate.status,
            final_decision=candidate.final_decision,
        )

    def final_decision(self, candidate_id: UUID, payload: FinalDecisionRequest) -> Candidate:
        candidate = self._candidate_or_404(candidate_id)
        to_status = CandidateStatus.PASSED if payload.decision == "PASSED" else CandidateStatus.REJECTED
        updated = self.repo.update_candidate(candidate.id, {"final_decision": payload.decision, "final_decision_reason": payload.reason, "final_decision_by": payload.actor_id, "final_decision_at": now_utc(), "status": to_status})
        self.repo.create_audit_log("FINAL_DECISION_SET", "candidate", candidate.id, {"decision": payload.decision}, actor_id=payload.actor_id)
        return updated

    def bulk_email(self, campaign_id: UUID, payload: BulkEmailRequest) -> dict[str, Any]:
        self._campaign_or_404(campaign_id)
        key = f"{campaign_id}:{payload.actor_email or 'anonymous'}"
        if not validate_secure_password(payload.secure_password, settings.SECURE_ACTION_PASSWORD):
            failures = self.repo.secure_failures.get(key, 0) + 1
            self.repo.secure_failures[key] = failures
            if failures >= 3:
                self.repo.create_audit_log("SECURE_CONFIRMATION_FAILED_3_TIMES", "campaign", campaign_id, {"failures": failures}, actor_email=payload.actor_email)
            raise AppError(403, "Secure confirmation failed.")

        events = []
        for candidate_id in payload.candidate_ids:
            candidate = self._candidate_or_404(candidate_id)
            if candidate.campaign_id != campaign_id:
                raise AppError(400, "All selected candidates must belong to the campaign.")
            decision = candidate.final_decision or ("PASSED" if candidate.status == CandidateStatus.PASSED else "REJECTED")
            email_type = EmailType.PASS_RESULT if decision == "PASSED" else EmailType.REJECT_RESULT
            body = self.ai.generate_candidate_feedback(candidate, decision, {"candidate": candidate.model_dump()})
            event = self.email.send(
                EmailEvent(
                    candidate_id=candidate.id,
                    campaign_id=campaign_id,
                    email_type=email_type,
                    recipient_email=candidate.email,
                    subject="Your HireTrain AI recruitment result",
                    body=body,
                )
            )
            events.append(self.repo.create_email_event(event))
            self._transition_candidate(candidate, CandidateStatus.CONTACTED, "Final result email confirmed and generated")

        self.repo.secure_failures[key] = 0
        self.repo.create_audit_log("BULK_EMAIL_CONFIRMED", "campaign", campaign_id, {"candidate_count": len(events)}, actor_email=payload.actor_email)
        return {"email_events": events, "updated_candidate_count": len(events)}

    def list_email_events(self, campaign_id: UUID | None = None):
        return self.repo.list_email_events(campaign_id)


_service = None


def get_module1_service() -> Module1Service:
    global _service
    if _service is None:
        _service = Module1Service()
    return _service


def reset_module1_service_for_tests() -> Module1Service:
    global _service
    _service = None
    return get_module1_service()

