from __future__ import annotations

from app.schemas.module1 import InterviewEvent, InterviewSession, Sentiment
from app.services.interview.base import InterviewProvider


class MockInterviewProvider(InterviewProvider):
    def start_session(self, session: InterviewSession) -> dict:
        return {
            "provider": "mock",
            "ai_prompt": "You are a frustrated customer asking for help with an unresolved support case.",
            "customer_sentiment": session.customer_sentiment,
        }

    def ingest_event(self, session: InterviewSession, event: InterviewEvent) -> dict:
        if event.event_type == "candidate_speech":
            reply = "Thank you for explaining. I need to know what you will do next and when I will hear back."
            sentiment = Sentiment.neutral
            if event.text and any(word in event.text.lower() for word in ["sorry", "understand", "resolve"]):
                sentiment = Sentiment.calm
                reply = "That helps. Please make sure I get a clear update."
            return {"reply": reply, "customer_sentiment": sentiment}
        if event.event_type == "network_disconnect":
            return {"reply": "System noted a network interruption.", "customer_sentiment": Sentiment.frustrated}
        return {"reply": None, "customer_sentiment": session.customer_sentiment}

    def finish_session(self, session: InterviewSession, events: list[InterviewEvent]) -> dict:
        return {"provider": "mock", "event_count": len(events)}
