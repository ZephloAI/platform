"""
Application configuration.

Loads settings from environment variables (or .env file).
All service URLs and secrets are centralized here.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    App settings loaded from environment variables.

    Copy .env.example to .env and fill in your values.
    """

    # Database connection string (async driver: asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/chatbot_saas"

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
    RESEND_FROM_EMAIL: str = "Flunkie <invites@flunkie.ai>"
    # Optional: if set, Resend's template rendering is used. Otherwise we send
    # a plain-HTML fallback generated in resend_client.py.
    RESEND_INVITE_TEMPLATE_ID: str = ""

    # Invite lifecycle
    INVITE_EXPIRY_DAYS: int = 7
    # Base URL the frontend serves the accept-invite page from. The token is
    # appended as a path segment: {base}/{token}
    INVITE_ACCEPT_URL_BASE: str = "http://localhost/invitations/accept"

    model_config = {"env_file": ".env", "extra": "ignore"}


# Single settings instance used across the app
settings = Settings()
