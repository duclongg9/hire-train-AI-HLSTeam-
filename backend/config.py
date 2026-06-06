from __future__ import annotations

from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HireTrain AI"
    API_V1_STR: str = "/api"
    APP_ENV: Literal["development", "production", "test"] = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    DEBUG: bool = False

    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    STORAGE_PROVIDER: Literal["mock", "supabase"] = "mock"
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    AI_PROVIDER: Literal["mock", "gemini"] = "mock"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    # Feature Flags
    ENABLE_VOICE_AI: bool = True
    MOCK_MODE: bool = False

    INTERVIEW_PROVIDER: Literal["mock", "gemini_live"] = "mock"
    GEMINI_LIVE_API_KEY: str = ""

    EMAIL_PROVIDER: Literal["mock", "smtp"] = "mock"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    # AWS Configuration
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET_NAME: str = "hiretrain-cv-bucket"

    TOKEN_SECRET: str = "development-token-secret-change-me"
    CANDIDATE_LINK_TTL_HOURS: int = Field(default=72, ge=1, le=720)
    SECURE_ACTION_PASSWORD: str = "demo123"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_provider_modes(self) -> "Settings":
        if self.APP_ENV == "production" and self.STORAGE_PROVIDER == "mock":
            raise ValueError("Mock storage is not allowed in production. Set STORAGE_PROVIDER=supabase.")

        if self.STORAGE_PROVIDER == "supabase":
            missing = [
                name
                for name in ("DATABASE_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
                if not getattr(self, name)
            ]
            if missing:
                raise ValueError(
                    "STORAGE_PROVIDER=supabase requires: " + ", ".join(missing)
                )

        if self.AI_PROVIDER == "gemini" and not self.GEMINI_API_KEY:
            raise ValueError("AI_PROVIDER=gemini requires GEMINI_API_KEY.")

        if self.INTERVIEW_PROVIDER == "gemini_live" and not self.GEMINI_LIVE_API_KEY:
            raise ValueError("INTERVIEW_PROVIDER=gemini_live requires GEMINI_LIVE_API_KEY.")

        if self.EMAIL_PROVIDER == "smtp":
            missing = [
                name
                for name in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM")
                if not getattr(self, name)
            ]
            if missing:
                raise ValueError("EMAIL_PROVIDER=smtp requires: " + ", ".join(missing))

        return self


settings = Settings()

