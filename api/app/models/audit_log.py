"""
Audit log entries for admin-visible organization activity.

Each row captures an action (e.g. "invite.sent", "limits.updated",
"org.suspended") along with the actor, target, and free-form metadata.
The admin dashboard reads from this table; other streams (e.g. the
invite flow) write to it by calling AuditLogService.record().
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, func

from app.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    actor_user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action = Column(String, nullable=False, index=True)
    target_type = Column(String, nullable=True)
    target_id = Column(String, nullable=True)
    extra = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
