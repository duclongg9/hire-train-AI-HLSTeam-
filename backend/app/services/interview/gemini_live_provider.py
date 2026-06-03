from __future__ import annotations

from app.services.interview.base import InterviewProvider


class GeminiLiveProvider(InterviewProvider):
    def _blocked(self):
        raise NotImplementedError(
            "INTERVIEW_PROVIDER=gemini_live is configured, but real Gemini Live/WebRTC is not implemented in this MVP."
        )

    def start_session(self, session):
        self._blocked()

    def ingest_event(self, session, event):
        self._blocked()

    def finish_session(self, session, events):
        self._blocked()
