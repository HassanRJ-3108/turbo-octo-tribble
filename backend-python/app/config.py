"""
Application Configuration

Loads environment variables using pydantic-settings.
All configuration is centralized here for easy access across the application.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Foodar Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database (Supabase PostgreSQL)
    SUPABASE_DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 0

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str

    # Clerk Authentication
    CLERK_SECRET_KEY: str
    CLERK_PUBLISHABLE_KEY: str
    CLERK_WEBHOOK_SECRET: str
    CLERK_WEBHOOK_SECRET: str
    CLERK_AUTHORIZED_PARTY: str | None = None

    # Lemon Squeezy Payments
    LEMON_SQUEEZY_API_KEY: str
    LEMON_SQUEEZY_WEBHOOK_SECRET: str
    LEMON_SQUEEZY_STORE_ID: str
    LEMON_SQUEEZY_VARIANT_ID: int = 1295088

    # Cloudinary Media Storage
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # Resend Email Service
    RESEND_API_KEY: str
    EMAIL_FROM_ADDRESS: str = "noreply@foodar.pk"

    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,https://foodar.pk,https://www.foodar.pk,https://*.foodar.pk,https://timelinx.store,https://www.timelinx.store,https://*.timelinx.store"

    @property
    def parsed_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # Security
    SECRET_KEY: str

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE_PROTECTED: int = 100
    RATE_LIMIT_PER_MINUTE_PUBLIC: int = 1000

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"


# Global settings instance
settings = Settings()
