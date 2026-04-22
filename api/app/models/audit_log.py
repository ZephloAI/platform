"""
AuditLog model.

Records significant actions taken inside an organization. Feeds the admin
dashboard (tracked under the admin-dashboard stream). Rows are append-only:
we write here, never update.

Example event_types: invite.sent, invite.resent, invite.accepted, invite.cancelled.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
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
    event_type = Column(String, nullable=False, index=True)
    # Free-form structured payload for per-event detail (invite id, email, etc).
    payload = Column(JSONB, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)

    organization = relationship("Organization")
    actor = relationship("User")
