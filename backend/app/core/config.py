import os
try:
    from pydantic_settings import BaseSettings
except Exception:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "lighthouse"
    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    # JWT settings for tenant extraction
    JWT_SECRET: str = "changeme"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth settings
    google_oidc_client_id: str = ""
    google_oidc_client_secret: str = ""
    google_oidc_redirect_uri: str = "http://localhost:18000/auth/callback"
    google_oidc_issuer: str = "https://accounts.google.com"

    # Frontend URL for OAuth redirects
    FRONTEND_URL: str = "http://localhost:5173"

    # Platform admin email
    PLATFORM_ADMIN_EMAIL: str = "mohammed.zuber@gmail.com"
    # Optional Redis URL for caching, social feed, rate limiting, etc.
    REDIS_URL: str | None = None
    # Social feed length cap
    SOCIAL_FEED_LENGTH: int = 200
    # Development-only: when set, use this tenant id as a fallback when no
    # tenant header or JWT is provided. Set via environment variable in dev.
    DEV_DEFAULT_TENANT: str | None = "dev-tenant"

    class Config:
        env_file = ".env"


settings = Settings()
