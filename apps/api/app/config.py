import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vyna"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "nestsync-super-secret-production-key-2026-srm-website")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Defaults to local SQLite for instant zero-dependency out-of-the-box local execution,
    # or can connect to Postgres / Supabase with DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nestsync.db")
    
    # Razorpay Payment Gateway (Test mode defaults)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_nestsync_mock_id")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock_razorpay_secret_key_12345")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "mock_webhook_secret_67890")
    
    # AI Provider
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "mock") # "gemini", "openai", "mock"
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", None)
    
    # Super Admin Bootstrap
    FIRST_SUPERUSER_EMAIL: str = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@nestsync.com")
    FIRST_SUPERUSER_PASSWORD: str = os.getenv("FIRST_SUPERUSER_PASSWORD", "Admin@NestSync2026!")
    FIRST_SUPERUSER_NAME: str = os.getenv("FIRST_SUPERUSER_NAME", "Platform Super Admin")
    
    # Supabase (Optional)
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY", None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
