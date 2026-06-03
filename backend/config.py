from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "HireTrain AI"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False  # Bật True để log SQL queries khi phát triển local
    
    # Feature Flags
    ENABLE_VOICE_AI: bool = True
    
    # CORS setup
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Database Configuration
    DATABASE_URL: str = "postgresql://user:password@localhost/hiretrain_db"
    
    # AWS Configuration
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET_NAME: str = "hiretrain-cv-bucket"
    
    # AI Config
    GEMINI_API_KEY: str = ""
    
    # SMTP Config
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

settings = Settings()
