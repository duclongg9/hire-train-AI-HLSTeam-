# ==============================================================================
# TODO: AWS MIGRATION MARKER
# Hiện tại đang sử dụng thư viện Google Gemini API (`google.generativeai`).
# Do dự án sẽ chuyển sang sử dụng các dịch vụ AI của AWS (như Amazon Bedrock 
# cho các model Claude/Llama/Titan), class này cần được thay thế hoặc viết lại 
# sử dụng boto3 kết nối tới AWS Bedrock (runtime client).
# ==============================================================================
import json
import google.generativeai as genai
from typing import Dict, Any
from app.core.config import settings

class GeminiClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.mock_mode = settings.MOCK_MODE
        
        if not self.mock_mode and self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def analyze_jd_to_rubric(self, text: str) -> Dict[str, Any]:
        """
        Analyze a Job Description and return a structured rubric schema (JSON).
        If MOCK_MODE is enabled, returns a dummy payload immediately.
        """
        if self.mock_mode:
            return {
                "hard_skills": [
                    {"name": "Python", "weight": 0.4},
                    {"name": "FastAPI", "weight": 0.3},
                    {"name": "AWS", "weight": 0.3}
                ],
                "soft_skills": [
                    {"name": "Communication", "weight": 0.5},
                    {"name": "Problem Solving", "weight": 0.5}
                ]
            }
            
        if not self.model:
            raise Exception("Gemini client not initialized properly and not in MOCK_MODE.")

        prompt = f"Analyze the following Job Description and extract the key hard skills and soft skills with suggested weights for scoring candidates. Return the output purely as a JSON object with keys 'hard_skills' and 'soft_skills'.\n\nJob Description:\n{text}"
        
        response = self.model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON from Gemini response"}

    def score_cv_against_rubric(self, cv_text: str, rubric_schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score a CV text against a rubric schema and return the evaluation (JSON).
        If MOCK_MODE is enabled, returns a mock payload immediately.
        """
        if self.mock_mode:
            return {
                "overall_score": 85.5,
                "strengths": ["Strong Python background", "Experience with AWS"],
                "weaknesses": ["Lack of direct FastAPI production experience"],
                "radar_dimensions": {
                    "Python": 90,
                    "FastAPI": 60,
                    "AWS": 85,
                    "Communication": 80,
                    "Problem Solving": 90
                }
            }
            
        if not self.model:
            raise Exception("Gemini client not initialized properly and not in MOCK_MODE.")

        prompt = (
            f"Score the following CV against the provided Rubric Schema. Return the output purely as a JSON object "
            f"with keys 'overall_score' (number 0-100), 'strengths' (list of strings), 'weaknesses' (list of strings), "
            f"and 'radar_dimensions' (a dictionary mapping skill names to scores 0-100).\n\n"
            f"Rubric Schema:\n{json.dumps(rubric_schema)}\n\n"
            f"CV Text:\n{cv_text}"
        )
        
        response = self.model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
            )
        )
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return {"error": "Failed to parse JSON from Gemini response"}

gemini_client = GeminiClient()
