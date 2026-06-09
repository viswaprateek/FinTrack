from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api"

    # Clerk JWT verification — JWKS endpoint for the Clerk instance, e.g.
    # https://<your-instance>.clerk.accounts.dev/.well-known/jwks.json
    CLERK_JWKS_URL: str
    CLERK_ISSUER: str | None = None
    # Backend API secret key — used to backfill profile fields when session JWT claims are empty.
    CLERK_SECRET_KEY: str | None = None

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://fin-track-client-nine.vercel.app",

    ]

    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.0-flash"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
