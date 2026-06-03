from __future__ import annotations

from config import settings
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.mock_provider import MockAIProvider

_ai_provider = None


def get_ai_provider():
    global _ai_provider
    if _ai_provider is None:
        if settings.AI_PROVIDER == "mock":
            _ai_provider = MockAIProvider()
        elif settings.AI_PROVIDER == "gemini":
            _ai_provider = GeminiProvider()
        else:
            raise RuntimeError(f"Unsupported AI provider: {settings.AI_PROVIDER}")
    return _ai_provider
