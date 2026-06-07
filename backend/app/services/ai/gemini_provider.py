from __future__ import annotations
import json
import re
from typing import Any
from uuid import UUID
import httpx

from config import settings
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

import time
from httpx import HTTPStatusError

def call_gemini(prompt: str, json_mode: bool = True, max_retries: int = 3) -> Any:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    if json_mode:
        payload["generationConfig"] = {"responseMimeType": "application/json"}
    
    with httpx.Client(timeout=120.0) as client:
        for attempt in range(max_retries):
            response = client.post(url, json=payload)
            try:
                response.raise_for_status()
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                if json_mode:
                    return json.loads(text)
                return text
            except HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    print(f"Rate limit hit (429). Retrying in 15 seconds... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(15)
                else:
                    raise

class GeminiProvider(AIProvider):
    def analyze_jd(self, position_id: UUID, jd_text: str) -> list[RubricCriterion]:
        prompt = f"""
You are a senior HR specialist. Analyze the Job Description or Rubric Criteria document and extract a structured scoring rubric as JSON.
If the text is a structured rubric criteria document, extract the exact criteria names, weights (must sum to 100), and descriptions as written.
Return ONLY a JSON object with key "criteria", which is an array of objects each having:
  name (string),
  category (one of: hard_skill, soft_skill, experience, certification),
  weight (integer, 0-100, the sum of all weights MUST be exactly 100),
  description (string).
No markdown, no explanation, pure JSON.

Text:
{jd_text}
"""
        result = call_gemini(prompt)
        criteria = []
        for item in result.get("criteria", []):
            try:
                cat_raw = item.get("category", "hard_skill")
                category = RubricCategory(cat_raw) if cat_raw in RubricCategory._value2member_map_ else RubricCategory.hard_skill
                criteria.append(RubricCriterion(
                    position_id=position_id,
                    category=category,
                    name=item["name"],
                    weight=int(item.get("weight", 10)),
                    description=item.get("description", ""),
                ))
            except Exception:
                continue
        return criteria

    def generate_test_questions(
        self,
        position_id: UUID,
        jd_text: str,
        rubric: list[RubricCriterion],
        count: int = 15,
    ) -> list[TestQuestion]:
        rubric_summary = "; ".join(f"{r.name} ({r.category})" for r in rubric)
        prompt = f"""
You are an HR test designer. Generate multiple-choice questions to assess candidates for the given role. 
Return ONLY a JSON object with key "questions", which is an array of objects each having:
  question_text (string), difficulty (easy|medium|hard), skill_tag (string),
  options (array of {{"id": "A/B/C/D", "text": "..."}}), correct_option_id (A/B/C/D),
  explanation (string).
No markdown, no extra text, pure JSON.

Job Description:
{jd_text}

Rubric criteria: {rubric_summary}

Generate {count} questions.
"""
        result = call_gemini(prompt)
        questions: list[TestQuestion] = []
        for idx, item in enumerate(result.get("questions", [])[:count], start=1):
            try:
                questions.append(TestQuestion(
                    position_id=position_id,
                    question_text=item["question_text"],
                    difficulty=item.get("difficulty", "medium"),
                    skill_tag=item.get("skill_tag", "general"),
                    options=item.get("options", []),
                    correct_option_id=item.get("correct_option_id"),
                    explanation=item.get("explanation", ""),
                    status=TestQuestionStatus.APPROVED,
                    order_index=idx,
                ))
            except Exception:
                continue
        return questions

    def score_candidate(self, candidate: Candidate, rubric: list[RubricCriterion]) -> CandidateScore:
        cv_text = candidate.cv_text or ""
        if not cv_text.strip():
            return CandidateScore(
                candidate_id=candidate.id,
                position_id=candidate.position_id,
                score=0.0,
                badge=CandidateBadge.GAP,
                ai_reasoning="No CV text provided.",
                score_breakdown={},
                risk_flags=["Empty CV"],
            )

        rubric_json = [{"name": r.name, "description": r.description, "weight": r.weight} for r in rubric]
        
        prompt = f"""
You are an expert HR evaluator. Score the candidate based ONLY on the provided CV text against the provided rubric.
The rubric is a list of criteria, each with a name, description, and weight (0-100).
For each criterion, score the candidate from 0.0 to 10.0 based on the CV.

Return ONLY a JSON object with the following keys:
- breakdown: an object where each key is the criterion name, and the value is an object with:
    - score: float 0-10
    - evidence: direct quote or reference from CV
    - reasoning: one sentence explanation
- ai_reasoning: Overall summary of the candidate (1-2 sentences).
- risk_flags: A list of strings identifying any red flags, job hopping, or missing required skills.

CV TEXT:
{cv_text}

RUBRIC:
{json.dumps(rubric_json, indent=2)}
"""
        try:
            result = call_gemini(prompt)
        except Exception as e:
            return CandidateScore(
                candidate_id=candidate.id,
                position_id=candidate.position_id,
                score=0.0,
                badge=CandidateBadge.GAP,
                ai_reasoning=f"AI evaluation failed: {str(e)}",
                score_breakdown={},
                risk_flags=[],
            )

        breakdown = result.get("breakdown", {})
        total_weight = sum(r.weight for r in rubric) or 1
        weighted_score = 0.0
        
        for criterion in rubric:
            c_result = breakdown.get(criterion.name, {})
            c_score = float(c_result.get("score", 0.0))
            weighted_score += c_score * (criterion.weight / total_weight)

        final_score_100 = round(weighted_score * 10, 2)
        if final_score_100 >= 75:
            badge = CandidateBadge.STRONG
        elif len(result.get("risk_flags", [])) > 0:
            badge = CandidateBadge.HIGH_RISK
        else:
            badge = CandidateBadge.GAP

        return CandidateScore(
            candidate_id=candidate.id,
            position_id=candidate.position_id,
            score=final_score_100,
            badge=badge,
            ai_reasoning=result.get("ai_reasoning", "Evaluated successfully."),
            score_breakdown=breakdown,
            risk_flags=result.get("risk_flags", []),
        )

    def screen_interview(self, session: InterviewSession, chat_history: list[InterviewEvent]) -> InterviewReport:
        return InterviewReport(
            candidate_id=session.candidate_id,
            campaign_id=session.campaign_id,
            interview_session_id=session.id,
            transcript=[
                {"speaker": event.speaker, "text": event.text, "event_type": event.event_type}
                for event in chat_history
                if event.text
            ],
            radar_scores={
                "communication": 85,
                "technical": 75,
                "culture_fit": 80,
                "problem_solving": 78,
            },
            summary="Mocked Gemini fallback report.",
            strengths=["Mock strength"],
            weaknesses=["Mock weakness"],
            recommendation="HIRE",
        )

    def extract_candidate_info(self, text: str) -> Any:
        return {}
        
    def generate_candidate_feedback(self, score: float, category: str) -> str:
        return "Good job."
        
    def generate_interview_report(self, session: InterviewSession, history: list[InterviewEvent]) -> InterviewReport:
        return self.screen_interview(session, history)

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
