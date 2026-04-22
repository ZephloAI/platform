"""
Audit log service.

Central place to record admin-visible actions. Other streams (e.g. the
Resend invite flow) call AuditLogService.record() so events show up in
the admin dashboard's per-organization activity feed.
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record(
        self,
        *,
        action: str,
        organization_id: int | None = None,
        actor_user_id: int | None = None,
        target_type: str | None = None,
        target_id: str | None = None,
        extra: dict | None = None,
    ) -> AuditLog:
        """Insert a new audit log row. Never raises on best-effort paths."""
        entry = AuditLog(
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            extra=extra,
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def list_for_org(self, organization_id: int, limit: int = 100) -> list[AuditLog]:
        result = await self.db.execute(
            select(AuditLog)
            .where(AuditLog.organization_id == organization_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
