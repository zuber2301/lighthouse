from pydantic import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "lighthouse"
    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    # JWT settings for tenant extraction
    JWT_SECRET: str = "changeme"
    JWT_ALGORITHM: str = "HS256"
    # Optional Redis URL for caching, social feed, rate limiting, etc.
    REDIS_URL: str | None = None
    # Social feed length cap
    SOCIAL_FEED_LENGTH: int = 200
    # Development-only: when set, use this tenant id as a fallback when no
    # tenant header or JWT is provided. Set via environment variable in dev.
    DEV_DEFAULT_TENANT: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
