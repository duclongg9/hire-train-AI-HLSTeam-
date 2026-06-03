from __future__ import annotations

import hmac
import secrets
from hashlib import sha256

from config import settings


def generate_raw_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(raw_token: str) -> str:
    return hmac.new(
        settings.TOKEN_SECRET.encode("utf-8"),
        raw_token.encode("utf-8"),
        sha256,
    ).hexdigest()


def verify_token(raw_token: str, token_hash: str) -> bool:
    return hmac.compare_digest(hash_token(raw_token), token_hash)
