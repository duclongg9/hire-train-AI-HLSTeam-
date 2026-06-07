from __future__ import annotations

from typing import Any

from app.schemas.module1 import (
    Candidate,
    CandidateBadge,
    CandidateScore,
    InterviewEvent,
    InterviewReport,
    InterviewSession,
    RubricCategory,
    RubricCriterion,
    TestQuestion,
    TestQuestionStatus,
)
from app.services.ai.base import AIProvider


class MockAIProvider(AIProvider):
    def analyze_jd(self, position_id, jd_text: str) -> list[RubricCriterion]:
        return [
            RubricCriterion(position_id=position_id, category=RubricCategory.hard_skill, name="CRM and ticket handling", weight=25, description="Uses CRM tools and keeps complete case notes."),
            RubricCriterion(position_id=position_id, category=RubricCategory.soft_skill, name="Communication and empathy", weight=30, description="Explains clearly and de-escalates frustrated customers."),
            RubricCriterion(position_id=position_id, category=RubricCategory.experience, name="Customer support experience", weight=25, description="Has relevant support or service operations experience."),
            RubricCriterion(position_id=position_id, category=RubricCategory.hard_skill, name="Problem solving", weight=15, description="Diagnoses issues and coordinates practical next steps."),
            RubricCriterion(position_id=position_id, category=RubricCategory.certification, name="Relevant training", weight=5, description="Customer service, communication, or product support training."),
        ]

    def generate_test_questions(self, position_id, jd_text: str, rubric: list[RubricCriterion], count: int = 15) -> list[TestQuestion]:
        stems = [
            "A customer has contacted support three times without resolution. What should you do first?",
            "Which CRM note is most useful for the next support agent?",
            "A customer asks for a refund that policy does not allow. What is the best response?",
            "How should urgent support tickets be prioritized?",
            "A product bug affects several customers. What should support do?",
            "What is the best way to confirm you understood a customer issue?",
            "A customer uses angry language in chat. What should you avoid?",
            "When should a ticket be escalated to engineering?",
            "What makes a support handoff effective?",
            "How should recurring customer complaints be documented?",
            "A customer reports the same problem after a workaround. What is the best next step?",
            "What is the strongest closing message after resolving a support case?",
            "How should a support agent respond when they need more investigation time?",
            "Which metric best reflects consistent support follow-through?",
            "What should be included in a bug escalation summary?",
            "How do you handle a customer who misunderstands product behavior?",
            "What is the best reason to tag a ticket accurately?",
            "How should sensitive customer information be handled?",
            "What should you do after spotting a recurring issue trend?",
            "How should you balance speed and accuracy in support?",
        ]
        questions: list[TestQuestion] = []
        for index, stem in enumerate(stems[:count], start=1):
            questions.append(
                TestQuestion(
                    position_id=position_id,
                    question_text=stem,
                    difficulty="medium" if index % 3 else "hard",
                    skill_tag="customer_support",
                    options=[
                        {"id": "A", "text": "Acknowledge the issue, verify context, and define a clear next step."},
                        {"id": "B", "text": "Ask the customer to start over with a new ticket."},
                        {"id": "C", "text": "Close the case if the answer is not obvious."},
                        {"id": "D", "text": "Promise an outcome before reviewing the facts."},
                    ],
                    correct_option_id="A",
                    explanation="The best option is structured, empathetic, and fact-based.",
                    status=TestQuestionStatus.APPROVED,
                    order_index=index,
                )
            )
        return questions

    def score_candidate(self, candidate: Candidate, rubric: list[RubricCriterion]) -> CandidateScore:
        text = (candidate.cv_text or "").lower()
        keyword_scores = {
            "crm": 18 if "crm" in text or "zendesk" in text else 6,
            "communication": 20 if "communication" in text or "chat" in text else 8,
            "experience": 20 if "years" in text or "senior" in text or "experience" in text else 10,
            "problem_solving": 17 if "resolution" in text or "escalation" in text or "problem" in text else 7,
            "empathy": 12 if "empathy" in text or "conflict" in text or "customer" in text else 5,
        }
        repeated = any(text.count(word) >= 8 for word in ["expert", "perfect", "guaranteed", "best"])
        score = min(100, sum(keyword_scores.values()))
        risk_flags = []
        badge = CandidateBadge.STRONG if score >= 75 else CandidateBadge.GAP
        if repeated:
            score = min(score, 55)
            badge = CandidateBadge.HIGH_RISK
            risk_flags.append("Repeated suspicious self-promotional keywords detected.")
        return CandidateScore(
            candidate_id=candidate.id,
            position_id=candidate.position_id,
            score=round(score, 2),
            badge=badge,
            ai_reasoning="Mock AI compared the CV text with the saved rubric and customer support keywords.",
            score_breakdown=keyword_scores,
            risk_flags=risk_flags,
        )

    def score_test_attempt(self, answers: list[dict[str, Any]], questions: list[TestQuestion]) -> dict[str, Any]:
        question_map = {str(question.id): question for question in questions}
        scored_answers = []
        correct = 0
        for answer in answers:
            question = question_map.get(str(answer.get("question_id")))
            selected = answer.get("selected_option_id")
            is_correct = bool(question and selected == question.correct_option_id)
            correct += 1 if is_correct else 0
            scored_answers.append({**answer, "is_correct": is_correct})
        max_score = len(questions)
        percentage = round((correct / max_score) * 100, 2) if max_score else 0
        return {
            "score": correct,
            "max_score": max_score,
            "percentage": percentage,
            "answers": scored_answers,
            "ai_feedback": f"Candidate answered {correct} of {max_score} questions correctly.",
        }

    def generate_interview_report(self, session: InterviewSession, events: list[InterviewEvent]) -> InterviewReport:
        transcript = [
            {"speaker": event.speaker, "text": event.text, "event_type": event.event_type, "created_at": event.created_at.isoformat()}
            for event in events
            if event.text
        ]
        candidate_lines = [event.text or "" for event in events if event.speaker == "candidate"]
        depth_bonus = min(10, len(" ".join(candidate_lines)) // 80)
        radar = {
            "communication": 78 + depth_bonus,
            "problem_solving": 74 + depth_bonus,
            "empathy": 82,
            "domain_knowledge": 72 + depth_bonus,
            "stress_handling": 80,
            "clarity": 81,
        }
        return InterviewReport(
            candidate_id=session.candidate_id,
            campaign_id=session.campaign_id,
            interview_session_id=session.id,
            transcript=transcript,
            radar_scores=radar,
            summary="Candidate completed the mock AI interview with structured responses and acceptable support judgment.",
            strengths=["Clear communication", "Empathetic tone", "Good ownership of next steps"],
            weaknesses=["Could provide more measurable follow-up commitments"],
            recommendation="Recommended for final HR review." if radar["communication"] >= 80 else "Review carefully before final decision.",
        )

    def generate_candidate_feedback(self, candidate: Candidate, decision: str, context: dict[str, Any]) -> str:
        if decision == "PASSED":
            return f"Dear {candidate.full_name}, congratulations. Your application has progressed successfully, and our HR team will contact you with next steps."
        return f"Dear {candidate.full_name}, thank you for taking part in the process. We will not move forward at this time, but we appreciate your effort and interest."

    def extract_candidate_info(self, cv_text: str) -> dict[str, str | None]:
        # Simple mock regex extraction
        import re
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text)
        phone_match = re.search(r'\+?\d[\d -]{8,12}\d', cv_text)
        
        # Simple name heuristic: first line or default
        lines = [l.strip() for l in cv_text.split('\n') if l.strip()]
        name = lines[0] if lines else "Mock Candidate"
        if len(name) > 50 or "@" in name or any(char.isdigit() for char in name):
            name = "Mock Candidate"

        return {
            "full_name": name,
            "email": email_match.group(0) if email_match else "mock.candidate@example.com",
            "phone": phone_match.group(0) if phone_match else "0987654321",
        }
