from __future__ import annotations

import os
import time

import httpx

BASE_URL = os.getenv("HIRETRAIN_API_BASE_URL", "http://127.0.0.1:8000")


def post(client: httpx.Client, path: str, json: dict | None = None) -> dict:
    response = client.post(f"{BASE_URL}{path}", json=json, timeout=30)
    response.raise_for_status()
    return response.json()


def get(client: httpx.Client, path: str) -> dict:
    response = client.get(f"{BASE_URL}{path}", timeout=30)
    response.raise_for_status()
    return response.json()


def main() -> None:
    suffix = str(int(time.time()))
    jd_text = (
        "We are hiring a Customer Support Specialist to handle customer inquiries across email, chat, and phone. "
        "The role requires strong communication, CRM experience, problem solving, empathy, conflict resolution, "
        "and the ability to document customer cases clearly. Candidates should manage difficult conversations, "
        "prioritize urgent issues, and collaborate with operations teams to resolve recurring customer problems."
    )

    with httpx.Client() as client:
        health = get(client, "/health")
        if health.get("storage_provider") != "supabase" or not health.get("database_connected"):
            raise RuntimeError(f"Backend is not using connected Supabase storage: {health}")

        campaign = post(
            client,
            "/api/campaigns",
            {"title": f"Supabase API Smoke {suffix}", "jd_text": jd_text},
        )
        campaign_id = campaign["id"]

        rubric = post(client, f"/api/campaigns/{campaign_id}/analyze-jd")
        questions = post(client, f"/api/campaigns/{campaign_id}/test-questions/generate", {"count": 10})
        post(client, f"/api/campaigns/{campaign_id}/test-questions/publish")
        published = post(client, f"/api/campaigns/{campaign_id}/publish")

        candidate = post(
            client,
            f"/api/public/jobs/{campaign_id}/apply",
            {
                "full_name": "Supabase Smoke Candidate",
                "email": f"supabase.smoke.{suffix}@example.com",
                "phone": "0900000444",
                "cv_text": "Experienced customer support specialist with CRM, chat, customer empathy, escalation, conflict resolution, communication, and problem solving experience.",
                "cv_file_name": "supabase_smoke_candidate.pdf",
            },
        )
        candidate_id = candidate["id"]

        cv_score = post(client, f"/api/campaigns/{campaign_id}/candidates/score", {"candidate_id": candidate_id})

        test_invite = post(client, f"/api/candidates/{candidate_id}/invite-test")
        test_token = test_invite["token"]
        test_open = get(client, f"/api/candidate/test/{test_token}")
        post(client, f"/api/candidate/test/{test_token}/start")
        answers = [
            {"question_id": question["id"], "selected_option_id": "A"}
            for question in test_open["questions"]
        ]
        test_submit = post(
            client,
            f"/api/candidate/test/{test_token}/submit",
            {"duration_seconds": 480, "answers": answers},
        )

        interview_invite = post(client, f"/api/candidates/{candidate_id}/invite-interview")
        interview_token = interview_invite["token"]
        post(
            client,
            f"/api/candidate/interview/{interview_token}/check-in",
            {"microphone_check_passed": True, "permission_state": "granted", "test_recording_seconds": 5},
        )
        post(client, f"/api/candidate/interview/{interview_token}/start")
        post(
            client,
            f"/api/candidate/interview/{interview_token}/event",
            {
                "event_type": "candidate_speech",
                "speaker": "candidate",
                "text": "I understand the frustration, I am sorry, and I will review the case history before giving a clear resolution plan.",
                "sentiment": "calm",
            },
        )
        report = post(client, f"/api/candidate/interview/{interview_token}/finish")

        decision = post(
            client,
            f"/api/candidates/{candidate_id}/final-decision",
            {"decision": "PASSED", "reason": "Supabase smoke test passed."},
        )
        email_result = post(
            client,
            f"/api/campaigns/{campaign_id}/bulk-email",
            {"candidate_ids": [candidate_id], "secure_password": "demo123", "actor_email": "hr@hiretrain.ai"},
        )
        final_review = get(client, f"/api/candidates/{candidate_id}/final-review")

    print("Supabase smoke test passed")
    print(
        {
            "campaign_id": campaign_id,
            "campaign_status": published["status"],
            "rubric_count": len(rubric),
            "question_count": len(questions),
            "candidate_id": candidate_id,
            "cv_score": cv_score["score"],
            "test_percentage": test_submit["percentage"],
            "interview_report_id": report["id"],
            "final_status": decision["status"],
            "email_events": email_result["updated_candidate_count"],
            "final_review_status": final_review["current_status"],
        }
    )


if __name__ == "__main__":
    main()
