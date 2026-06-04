import os

os.environ.update(
    {
        "APP_ENV": "development",
        "STORAGE_PROVIDER": "mock",
        "DATABASE_URL": "",
        "SUPABASE_URL": "",
        "SUPABASE_SERVICE_ROLE_KEY": "",
        "AI_PROVIDER": "mock",
        "INTERVIEW_PROVIDER": "mock",
        "EMAIL_PROVIDER": "mock",
    }
)
from fastapi.testclient import TestClient

from main import app


def test_module1_demo_flow():
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["storage_provider"] == "mock"

        campaigns = client.get("/api/campaigns")
        assert campaigns.status_code == 200
        campaign_id = campaigns.json()[0]["id"]

        analyzed = client.post(f"/api/campaigns/{campaign_id}/analyze-jd")
        assert analyzed.status_code == 200
        assert sum(item["weight"] for item in analyzed.json()) == 100

        generated = client.post(f"/api/campaigns/{campaign_id}/test-questions/generate", json={"count": 10})
        assert generated.status_code == 200
        assert len(generated.json()) == 10

        published_questions = client.post(f"/api/campaigns/{campaign_id}/test-questions/publish")
        assert published_questions.status_code == 200

        published_campaign = client.post(f"/api/campaigns/{campaign_id}/publish")
        assert published_campaign.status_code == 200
        assert published_campaign.json()["status"] == "ACTIVE"

        applied = client.post(
            f"/api/public/jobs/{campaign_id}/apply",
            json={
                "full_name": "Demo Applicant",
                "email": "demo.applicant@example.com",
                "phone": "0900000999",
                "cv_text": "Experienced customer support specialist with CRM, chat, conflict resolution, communication, and problem solving experience.",
                "cv_file_name": "demo_applicant.pdf",
            },
        )
        assert applied.status_code == 201
        candidate_id = applied.json()["id"]

        scored = client.post(f"/api/campaigns/{campaign_id}/candidates/score", json={"candidate_id": candidate_id})
        assert scored.status_code == 200
        assert scored.json()["score"] > 0

        invite_test = client.post(f"/api/candidates/{candidate_id}/invite-test")
        assert invite_test.status_code == 200
        test_token = invite_test.json()["token"]

        test_open = client.get(f"/api/candidate/test/{test_token}")
        assert test_open.status_code == 200
        questions = test_open.json()["questions"]

        started = client.post(f"/api/candidate/test/{test_token}/start")
        assert started.status_code == 200

        submitted = client.post(
            f"/api/candidate/test/{test_token}/submit",
            json={
                "duration_seconds": 600,
                "answers": [
                    {"question_id": question["id"], "selected_option_id": "A"}
                    for question in questions
                ],
            },
        )
        assert submitted.status_code == 200
        assert submitted.json()["percentage"] == 100

        invite_interview = client.post(f"/api/candidates/{candidate_id}/invite-interview")
        assert invite_interview.status_code == 200
        interview_token = invite_interview.json()["token"]

        check_in = client.post(
            f"/api/candidate/interview/{interview_token}/check-in",
            json={"microphone_check_passed": True, "permission_state": "granted", "test_recording_seconds": 5},
        )
        assert check_in.status_code == 200

        interview_start = client.post(f"/api/candidate/interview/{interview_token}/start")
        assert interview_start.status_code == 200

        event = client.post(
            f"/api/candidate/interview/{interview_token}/event",
            json={
                "event_type": "candidate_speech",
                "speaker": "candidate",
                "text": "I understand the frustration, I am sorry, and I will review the case history before giving a clear resolution plan.",
                "sentiment": "calm",
            },
        )
        assert event.status_code == 200

        report = client.post(f"/api/candidate/interview/{interview_token}/finish")
        assert report.status_code == 200
        assert "communication" in report.json()["radar_scores"]

        final_review = client.get(f"/api/candidates/{candidate_id}/final-review")
        assert final_review.status_code == 200
        assert final_review.json()["test_attempt"]["percentage"] == 100

        wrong_email = client.post(
            f"/api/campaigns/{campaign_id}/bulk-email",
            json={"candidate_ids": [candidate_id], "secure_password": "wrong", "actor_email": "hr@hiretrain.ai"},
        )
        assert wrong_email.status_code == 403

        decision = client.post(
            f"/api/candidates/{candidate_id}/final-decision",
            json={"decision": "PASSED", "reason": "Strong end-to-end demo performance."},
        )
        assert decision.status_code == 200
        assert decision.json()["status"] == "PASSED"

        sent = client.post(
            f"/api/campaigns/{campaign_id}/bulk-email",
            json={"candidate_ids": [candidate_id], "secure_password": "demo123", "actor_email": "hr@hiretrain.ai"},
        )
        assert sent.status_code == 200
        assert sent.json()["updated_candidate_count"] == 1

        # Test applying with file upload
        from unittest.mock import patch
        with patch("app.core.document_parser.extract_text_from_pdf", return_value="John Doe\ntest.candidate@example.com\n0987654321\nSome cv text"):
            applied_file = client.post(
                f"/api/public/jobs/{campaign_id}/apply-file",
                files={"file": ("test_candidate.pdf", b"dummy pdf content", "application/pdf")}
            )
            assert applied_file.status_code == 201
            data = applied_file.json()
            assert data["full_name"] == "John Doe"
            assert data["email"] == "test.candidate@example.com"
            assert data["phone"] == "0987654321"

