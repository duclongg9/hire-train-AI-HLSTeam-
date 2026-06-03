from __future__ import annotations

from config import settings
from app.services.interview.gemini_live_provider import GeminiLiveProvider
from app.services.interview.mock_provider import MockInterviewProvider

_interview_provider = None


def get_interview_provider():
    global _interview_provider
    if _interview_provider is None:
        if settings.INTERVIEW_PROVIDER == "mock":
            _interview_provider = MockInterviewProvider()
        elif settings.INTERVIEW_PROVIDER == "gemini_live":
            _interview_provider = GeminiLiveProvider()
        else:
            raise RuntimeError(f"Unsupported interview provider: {settings.INTERVIEW_PROVIDER}")
    return _interview_provider
