from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.module1 import EmailEvent


class EmailProvider(ABC):
    @abstractmethod
    def send(self, event: EmailEvent) -> EmailEvent:
        raise NotImplementedError
