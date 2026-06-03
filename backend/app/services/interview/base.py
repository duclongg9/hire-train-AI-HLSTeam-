from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.module1 import InterviewEvent, InterviewSession


class InterviewProvider(ABC):
    @abstractmethod
    def start_session(self, session: InterviewSession) -> dict:
        raise NotImplementedError

    @abstractmethod
    def ingest_event(self, session: InterviewSession, event: InterviewEvent) -> dict:
        raise NotImplementedError

    @abstractmethod
    def finish_session(self, session: InterviewSession, events: list[InterviewEvent]) -> dict:
        raise NotImplementedError
