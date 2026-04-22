"""
AuditLog repository — append-only writes for organization events.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, AuditLog)

    async def log(
        self,
        event_type: str,
        organization_id: int | None = None,
        actor_user_id: int | None = None,
        payload: dict[str, Any] | None = None,
    ) -> AuditLog:
        """Write a single audit row. Returns the persisted record."""
        return await self.create(
            event_type=event_type,
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            payload=payload,
        )
