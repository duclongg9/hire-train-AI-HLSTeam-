from __future__ import annotations

from app.services.email.base import EmailProvider


class SMTPEmailProvider(EmailProvider):
    def send(self, event):
        raise NotImplementedError(
            "EMAIL_PROVIDER=smtp is configured and credentials are validated, but SMTP sending is not implemented in this MVP."
        )
