from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.schemas.module1 import Candidate, CandidateScore, InterviewEvent, InterviewReport, InterviewSession, RubricCriterion, TestQuestion


class AIProvider(ABC):
    @abstractmethod
    def analyze_jd(self, position_id, jd_text: str) -> list[RubricCriterion]:
        raise NotImplementedError

    @abstractmethod
    def generate_test_questions(self, position_id, jd_text: str, rubric: list[RubricCriterion], count: int = 15) -> list[TestQuestion]:
        raise NotImplementedError

    @abstractmethod
    def score_candidate(self, candidate: Candidate, rubric: list[RubricCriterion]) -> CandidateScore:
        raise NotImplementedError

    @abstractmethod
    def score_test_attempt(self, answers: list[dict[str, Any]], questions: list[TestQuestion]) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def generate_interview_report(self, session: InterviewSession, events: list[InterviewEvent]) -> InterviewReport:
        raise NotImplementedError

    @abstractmethod
    def generate_candidate_feedback(self, candidate: Candidate, decision: str, context: dict[str, Any]) -> str:
        raise NotImplementedError

    @abstractmethod
    def extract_candidate_info(self, cv_text: str) -> dict[str, str | None]:
        raise NotImplementedError
