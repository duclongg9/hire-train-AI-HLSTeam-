from __future__ import annotations

from app.services.ai.base import AIProvider


class GeminiProvider(AIProvider):
    def _blocked(self):
        raise NotImplementedError(
            "AI_PROVIDER=gemini is configured, but Gemini integration is not implemented in this MVP. "
            "Provide GEMINI_API_KEY only when adding the real provider implementation."
        )

    def analyze_jd(self, campaign_id, jd_text: str):
        self._blocked()

    def generate_test_questions(self, campaign_id, jd_text: str, rubric, count: int = 15):
        self._blocked()

    def score_candidate(self, candidate, rubric):
        self._blocked()

    def score_test_attempt(self, answers, questions):
        self._blocked()

    def generate_interview_report(self, session, events):
        self._blocked()

    def generate_candidate_feedback(self, candidate, decision: str, context: dict):
        self._blocked()
