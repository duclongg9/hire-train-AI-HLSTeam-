from __future__ import annotations

from config import settings
from app.repositories.mock_repository import MockRepository
from app.repositories.supabase_repository import SupabaseRepository

_repository = None


def get_repository():
    global _repository
    if _repository is None:
        if settings.STORAGE_PROVIDER == "mock":
            print("Running with mock storage. Supabase is not active.")
            _repository = MockRepository()
        elif settings.STORAGE_PROVIDER == "supabase":
            _repository = SupabaseRepository()
        else:
            raise RuntimeError(f"Unsupported storage provider: {settings.STORAGE_PROVIDER}")
    return _repository


def reset_repository_for_tests():
    global _repository
    _repository = None
    return get_repository()
