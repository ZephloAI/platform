"""
Application configuration.

Loads settings from environment variables (or .env file).
All service URLs and secrets are centralized here.
"""

from pathlib import Path

from pydantic_settings import BaseSettings

# Repo-root .env (api/app/config.py → ../../.. → repo root).
# Lets local dev pick up the shared root .env regardless of CWD.
# In Docker/k8s, container env vars take precedence and this file is absent.
_ROOT_ENV = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    """
    App settings loaded from environment variables.

    Copy .env.example to .env and fill in your values.
    """

    # Database connection string (async driver: asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/chatbot_saas"

    # Redis (used for caching hot public endpoints)
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT authentication settings
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # OAuth provider settings
    GOOGLE_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_TENANT_ID: str = "common"

    # External service URLs
    CRAWLER_SERVICE_URL: str = "http://localhost:8001"
    AGENT_SERVICE_URL: str = "http://localhost:8002"
    # Callback URL for the crawler to reach the API (use Docker service name in Docker)
    API_CALLBACK_URL: str = "http://localhost:8000"

    # Resend (transactional email)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "Zephlo <noreply@zephlo.com>"
    # Optional: if set, Resend's template rendering is used. Otherwise we send
    # a plain-HTML fallback generated in resend_client.py.
    RESEND_INVITE_TEMPLATE_ID: str = ""

    # Invite lifecycle
    INVITE_EXPIRY_DAYS: int = 7

    # Public URL of the frontend — used to build links in outgoing emails
    FRONTEND_URL: str = "http://localhost"

    # Base URL the frontend serves the accept-invite page from. The token is
    # appended as a path segment: {base}/{token}
    INVITE_ACCEPT_URL_BASE: str = f"{FRONTEND_URL}/invitations/accept"

    # Password reset settings
    PASSWORD_RESET_TOKEN_TTL_MINUTES: int = 15

    model_config = {"env_file": (str(_ROOT_ENV), ".env"), "extra": "ignore"}


# Single settings instance used across the app
settings = Settings()
