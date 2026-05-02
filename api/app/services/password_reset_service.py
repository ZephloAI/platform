"""
Password reset service.

Responsibilities:
- Generate cryptographically-strong reset tokens, store only their hash.
- Send reset emails through the shared Resend client.
- Consume tokens atomically (single use) and update the user password.
- Bump users.password_changed_at so existing JWTs are rejected.
"""

import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.password_reset_token import PasswordResetToken
from app.repositories.password_reset_token_repository import (
    PasswordResetTokenRepository,
)
from app.repositories.user_repository import UserRepository
from app.services.resend_client import send_email

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_token(raw_token: str) -> str:
    """SHA-256 hex digest of the raw token — what we store in the DB."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_token() -> str:
    """URL-safe random token (~43 chars, 256 bits of entropy)."""
    return secrets.token_urlsafe(32)


def build_reset_email(reset_url: str) -> tuple[str, str, str]:
    """Return (subject, html_body, text_body) for a password reset email."""
    subject = "Reset your Zephlo password"
    minutes = settings.PASSWORD_RESET_TOKEN_TTL_MINUTES
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px;">
      <h1 style="font-size: 22px; color: #1d1d1f;">Reset your password</h1>
      <p style="color: #515154; line-height: 1.6;">
        We received a request to reset the password for your Zephlo account.
        Click the button below to choose a new one. This link expires in {minutes} minutes
        and can only be used once.
      </p>
      <p style="margin: 32px 0;">
        <a href="{reset_url}"
           style="background: #0071e3; color: #ffffff; padding: 12px 20px; border-radius: 10px; text-decoration: none; font-weight: 500;">
          Reset password
        </a>
      </p>
      <p style="color: #86868b; font-size: 13px; line-height: 1.5;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    </div>
    """
    text = (
        f"Reset your Zephlo password by opening this link within {minutes} minutes:\n\n"
        f"{reset_url}\n\n"
        f"If you didn't request a reset, you can ignore this email."
    )
    return subject, html, text


class PasswordResetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = PasswordResetTokenRepository(db)

    async def request_reset(self, email: str) -> None:
        """
        Create a reset token for the given email (if the account exists)
        and send it by email. Callers must always return a 200 response
        regardless of whether the email matched — don't leak existence.
        """
        user = await self.user_repo.get_by_email(email)
        if user is None:
            logger.info(f"Password reset requested for unknown email {email}")
            return

        raw_token = generate_token()
        token_hash = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_TOKEN_TTL_MINUTES
        )

        await self.token_repo.create(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw_token}"
        subject, html, text = build_reset_email(reset_url)
        try:
            await send_email(to=user.email, subject=subject, html=html, text=text)
        except Exception as exc:
            # Don't leak failures to the caller — reset tokens are already
            # stored, and they'll expire if unused. Log for ops.
            logger.exception(f"Failed to send password reset email to {user.email}: {exc}")

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        """
        Consume a reset token and update the user's password.

        Raises 400 for invalid, expired, or already-used tokens and for
        passwords that don't meet the minimum length requirement.
        """
        if len(new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters",
            )

        token_hash = hash_token(raw_token)
        record = await self.token_repo.get_by_hash(token_hash)

        now = datetime.now(timezone.utc)
        if record is None or not self._is_valid(record, now):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        user = await self.user_repo.get_by_id(record.user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        user.password_hash = pwd_context.hash(new_password)
        # Bump so any outstanding JWTs for this user are rejected.
        user.password_changed_at = now
        await self.db.commit()

        # Mark this token used and invalidate any siblings so they can't
        # double-reset the account.
        await self.token_repo.invalidate_user_tokens(user.id, now)

    @staticmethod
    def _is_valid(record: PasswordResetToken, now: datetime) -> bool:
        if record.used_at is not None:
            return False
        return record.expires_at > now

    @staticmethod
    def tokens_match(expected_hash: str, raw_token: str) -> bool:
        """Constant-time comparison of token hashes."""
        return hmac.compare_digest(expected_hash, hash_token(raw_token))
