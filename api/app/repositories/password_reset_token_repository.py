"""
Password reset token repository.
"""

from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_token import PasswordResetToken
from app.repositories.base import BaseRepository


class PasswordResetTokenRepository(BaseRepository[PasswordResetToken]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, PasswordResetToken)

    async def get_by_hash(self, token_hash: str) -> PasswordResetToken | None:
        """Look up a token record by its SHA-256 hash."""
        result = await self.db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, token_id: int, used_at: datetime) -> None:
        """Stamp a token as consumed so it can't be replayed."""
        await self.db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.id == token_id)
            .values(used_at=used_at)
        )
        await self.db.commit()

    async def invalidate_user_tokens(self, user_id: int, used_at: datetime) -> None:
        """Mark every outstanding token for a user as used."""
        await self.db.execute(
            update(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.used_at.is_(None),
            )
            .values(used_at=used_at)
        )
        await self.db.commit()
