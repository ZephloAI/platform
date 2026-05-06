"""
Auth router - registration, login, and password reset endpoints.

These are public endpoints (no authentication required).

Flow:
  Router receives request
  -> AuthService / PasswordResetService handles business logic
  -> Repository accesses the database
  -> Response returned to client
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import (
    ForgotPasswordRequest,
    GenericMessageResponse,
    LoginRequest,
    LoginResponse,
    OAuthRequest,
    ResetPasswordRequest,
    UserCreate,
)
from app.services.auth_service import AuthService
from app.services.oauth_service import OAuthService
from app.services.password_reset_service import PasswordResetService
from app.services.rate_limiter import (
    password_reset_email_limiter,
    password_reset_ip_limiter,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Neutral message used for /forgot-password — the same text is returned
# whether or not the email exists, so attackers can't probe the user list.
_FORGOT_PASSWORD_MESSAGE = (
    "If an account exists for that email, a reset link has been sent."
)


def _client_ip(request: Request) -> str:
    """Best-effort client IP, honoring X-Forwarded-For when present."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=LoginResponse)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.

    - Validates email format and password length (min 6 chars)
    - Hashes the password with bcrypt
    - Returns user info + JWT token

    Raises 400 if the email is already taken.
    """
    auth_service = AuthService(db)
    return await auth_service.register(
        body.email,
        body.password,
        body.first_name,
        body.last_name,
        invitation_token=body.invitation_token,
    )


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Log in with email and password.

    - Verifies the password against the stored hash
    - Returns user info + JWT token

    Raises 401 if credentials are invalid.
    """
    auth_service = AuthService(db)
    return await auth_service.login(body.email, body.password)


@router.post("/oauth", response_model=LoginResponse)
async def oauth_login(body: OAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Log in or register via an OAuth provider (Google or Microsoft).

    - Verifies the provider's ID token
    - Finds or creates the user account
    - Returns user info + JWT token
    """
    oauth_service = OAuthService(db)
    return await oauth_service.authenticate(
        body.provider, body.id_token, invitation_token=body.invitation_token
    )


@router.post("/forgot-password", response_model=GenericMessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Start a password reset.

    Always returns 200 with the same message — we never tell callers
    whether the email exists. Rate limited per-email and per-IP to
    stop enumeration and mailbox spam.
    """
    email = body.email.lower()
    ip = _client_ip(request)

    if not password_reset_ip_limiter.allow(f"ip:{ip}"):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please try again later.",
        )
    if not password_reset_email_limiter.allow(f"email:{email}"):
        # Email-limited callers get the same neutral response — still
        # don't leak existence, just slow them down.
        return GenericMessageResponse(message=_FORGOT_PASSWORD_MESSAGE)

    service = PasswordResetService(db)
    await service.request_reset(email)
    return GenericMessageResponse(message=_FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=GenericMessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Complete a password reset using a one-time token.

    Invalidates outstanding tokens and bumps password_changed_at so
    any existing JWTs for this user are rejected.
    """
    service = PasswordResetService(db)
    await service.reset_password(body.token, body.new_password)
    return GenericMessageResponse(message="Password updated successfully.")
