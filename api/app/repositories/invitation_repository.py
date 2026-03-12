"""
Invitation repository - database access for the Invitation model.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invitation import Invitation
from app.repositories.base import BaseRepository


class InvitationRepository(BaseRepository[Invitation]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Invitation)

    async def get_by_token(self, token: str) -> Invitation | None:
        """Look up an invitation by its token."""
        result = await self.db.execute(
            select(Invitation).where(Invitation.token == token)
        )
        return result.scalar_one_or_none()

    async def get_pending_for_org(self, org_id: int) -> list[Invitation]:
        """Get all pending invitations for an organization."""
        result = await self.db.execute(
            select(Invitation).where(
                Invitation.organization_id == org_id,
                Invitation.status == "pending",
            )
        )
        return list(result.scalars().all())
