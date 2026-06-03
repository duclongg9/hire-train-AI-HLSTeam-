from __future__ import annotations

from config import settings
from app.services.email.mock_provider import MockEmailProvider
from app.services.email.smtp_provider import SMTPEmailProvider

_email_provider = None


def get_email_provider():
    global _email_provider
    if _email_provider is None:
        if settings.EMAIL_PROVIDER == "mock":
            _email_provider = MockEmailProvider()
        elif settings.EMAIL_PROVIDER == "smtp":
            _email_provider = SMTPEmailProvider()
        else:
            raise RuntimeError(f"Unsupported email provider: {settings.EMAIL_PROVIDER}")
    return _email_provider
