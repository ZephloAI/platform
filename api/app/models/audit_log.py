"""
AuditLog model.

Append-only record of admin-visible organization activity. Rows capture
an action string (e.g. "invite.sent", "invite.accepted", "limits.updated",
"org.suspended") together with the actor, an optional target, and free-form
metadata. The admin dashboard reads from this table; other streams (invite
flow, admin limit changes, suspensions) write to it through
AuditLogService.record().
"""

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import relationship

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

    organization = relationship("Organization")
    actor = relationship("User")
