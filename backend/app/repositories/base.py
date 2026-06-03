from __future__ import annotations

from typing import Protocol


class HireTrainRepository(Protocol):
    def check_connection(self) -> bool:
        ...
