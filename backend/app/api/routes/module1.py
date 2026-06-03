from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Body, Depends

from app.schemas.module1 import (
    BulkCandidateScoreRequest,
    BulkEmailRequest,
    CampaignCreate,
    CampaignUpdate,
    CandidateApplyRequest,
    CandidateCompareRequest,
    CandidateScoreRequest,
    CandidateStatusUpdateRequest,
    FinalDecisionRequest,
    GenerateTestQuestionsRequest,
    InterviewCheckInRequest,
    InterviewEventCreate,
    MockLoginRequest,
    RubricUpsertRequest,
    TestQuestionUpsertRequest,
    TestSubmitRequest,
    UserCreate,
)
from app.services.module1_service import Module1Service, get_module1_service

router = APIRouter()


def service_dep() -> Module1Service:
    return get_module1_service()


@router.post("/auth/mock-login")
def mock_login(payload: MockLoginRequest, service: Module1Service = Depends(service_dep)):
    return service.mock_login(payload)


@router.get("/admin/users")
def list_users(service: Module1Service = Depends(service_dep)):
    return service.list_users()


@router.post("/admin/users", status_code=201)
def create_user(payload: UserCreate, service: Module1Service = Depends(service_dep)):
    return service.create_user(payload)


@router.get("/admin/audit-logs")
def list_admin_audit_logs(service: Module1Service = Depends(service_dep)):
    return service.list_audit_logs()


@router.get("/campaigns")
def list_campaigns(service: Module1Service = Depends(service_dep)):
    return service.list_campaigns()


@router.post("/campaigns", status_code=201)
def create_campaign(payload: CampaignCreate, service: Module1Service = Depends(service_dep)):
    return service.create_campaign(payload)


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.get_campaign(campaign_id)


@router.patch("/campaigns/{campaign_id}")
def update_campaign(campaign_id: UUID, payload: CampaignUpdate, service: Module1Service = Depends(service_dep)):
    return service.update_campaign(campaign_id, payload)


@router.post("/campaigns/{campaign_id}/analyze-jd")
def analyze_jd(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.analyze_jd(campaign_id)


@router.put("/campaigns/{campaign_id}/rubric")
def upsert_rubric(campaign_id: UUID, payload: RubricUpsertRequest, service: Module1Service = Depends(service_dep)):
    return service.upsert_rubric(campaign_id, payload)


@router.post("/campaigns/{campaign_id}/publish")
def publish_campaign(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.publish_campaign(campaign_id)


@router.post("/campaigns/{campaign_id}/test-questions/generate")
def generate_test_questions(campaign_id: UUID, payload: GenerateTestQuestionsRequest, service: Module1Service = Depends(service_dep)):
    return service.generate_test_questions(campaign_id, payload)


@router.get("/campaigns/{campaign_id}/test-questions")
def list_test_questions(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.list_test_questions(campaign_id)


@router.put("/campaigns/{campaign_id}/test-questions")
def upsert_test_questions(campaign_id: UUID, payload: TestQuestionUpsertRequest, service: Module1Service = Depends(service_dep)):
    return service.upsert_test_questions(campaign_id, payload)


@router.post("/campaigns/{campaign_id}/test-questions/publish")
def publish_test_questions(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.publish_test_questions(campaign_id)


@router.get("/public/jobs/{campaign_id}")
def get_public_job(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.get_public_job(campaign_id)


@router.post("/public/jobs/{campaign_id}/apply", status_code=201)
def apply_candidate(campaign_id: UUID, payload: CandidateApplyRequest, service: Module1Service = Depends(service_dep)):
    return service.apply_candidate(campaign_id, payload)


@router.get("/campaigns/{campaign_id}/candidates")
def list_candidates(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.list_candidates(campaign_id)


@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.get_candidate(candidate_id)


@router.get("/campaigns/{campaign_id}/leaderboard")
def leaderboard(campaign_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.leaderboard(campaign_id)


@router.post("/campaigns/{campaign_id}/candidates/score")
def score_candidate(campaign_id: UUID, payload: CandidateScoreRequest | None = Body(default=None), service: Module1Service = Depends(service_dep)):
    if payload and payload.candidate_id:
        return service.score_candidate(campaign_id, payload.candidate_id)
    return service.bulk_score_candidates(campaign_id)


@router.post("/campaigns/{campaign_id}/candidates/bulk-score")
def bulk_score_candidates(campaign_id: UUID, payload: BulkCandidateScoreRequest | None = Body(default=None), service: Module1Service = Depends(service_dep)):
    return service.bulk_score_candidates(campaign_id, payload.candidate_ids if payload else None)


@router.patch("/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: UUID, payload: CandidateStatusUpdateRequest, service: Module1Service = Depends(service_dep)):
    return service.update_candidate_status(candidate_id, payload)


@router.post("/campaigns/{campaign_id}/candidates/compare")
def compare_candidates(campaign_id: UUID, payload: CandidateCompareRequest, service: Module1Service = Depends(service_dep)):
    return service.compare_candidates(campaign_id, payload)


@router.post("/candidates/{candidate_id}/invite-test")
def invite_test(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.invite_test(candidate_id)


@router.post("/candidates/{candidate_id}/invite-interview")
def invite_interview(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.invite_interview(candidate_id)


@router.get("/candidate/test/{token}")
def open_test(token: str, service: Module1Service = Depends(service_dep)):
    return service.open_test(token)


@router.post("/candidate/test/{token}/start")
def start_test(token: str, service: Module1Service = Depends(service_dep)):
    return service.start_test(token)


@router.post("/candidate/test/{token}/submit")
def submit_test(token: str, payload: TestSubmitRequest, service: Module1Service = Depends(service_dep)):
    return service.submit_test(token, payload)


@router.get("/candidate/test/{token}/result")
def test_result(token: str, service: Module1Service = Depends(service_dep)):
    return service.test_result(token)


@router.get("/candidate/interview/{token}")
def open_interview(token: str, service: Module1Service = Depends(service_dep)):
    return service.open_interview(token)


@router.post("/candidate/interview/{token}/check-in")
def check_in_interview(token: str, payload: InterviewCheckInRequest, service: Module1Service = Depends(service_dep)):
    return service.check_in_interview(token, payload)


@router.post("/candidate/interview/{token}/start")
def start_interview(token: str, service: Module1Service = Depends(service_dep)):
    return service.start_interview(token)


@router.post("/candidate/interview/{token}/event")
def ingest_interview_event(token: str, payload: InterviewEventCreate, service: Module1Service = Depends(service_dep)):
    return service.ingest_interview_event(token, payload)


@router.post("/candidate/interview/{token}/finish")
def finish_interview(token: str, service: Module1Service = Depends(service_dep)):
    return service.finish_interview(token)


@router.get("/candidate/interview/{token}/report")
def candidate_interview_report(token: str, service: Module1Service = Depends(service_dep)):
    invitation = service._valid_interview_invitation(token)
    return service.interview_report(invitation.candidate_id)


@router.get("/candidates/{candidate_id}/interview-report")
def interview_report(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.interview_report(candidate_id)


@router.get("/candidates/{candidate_id}/final-review")
def final_review(candidate_id: UUID, service: Module1Service = Depends(service_dep)):
    return service.final_review(candidate_id)


@router.post("/candidates/{candidate_id}/final-decision")
def final_decision(candidate_id: UUID, payload: FinalDecisionRequest, service: Module1Service = Depends(service_dep)):
    return service.final_decision(candidate_id, payload)


@router.post("/campaigns/{campaign_id}/bulk-email")
def bulk_email(campaign_id: UUID, payload: BulkEmailRequest, service: Module1Service = Depends(service_dep)):
    return service.bulk_email(campaign_id, payload)


@router.get("/emails")
def list_email_events(campaign_id: UUID | None = None, service: Module1Service = Depends(service_dep)):
    return service.list_email_events(campaign_id)
