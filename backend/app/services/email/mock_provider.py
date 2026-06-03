from __future__ import annotations

from app.schemas.module1 import EmailEvent, EmailEventStatus
from app.services.email.base import EmailProvider


class MockEmailProvider(EmailProvider):
    def send(self, event: EmailEvent) -> EmailEvent:
        return event.model_copy(update={"status": EmailEventStatus.PREVIEW, "provider": "mock"})
