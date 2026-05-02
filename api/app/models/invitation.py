"""
Invitation model.

Represents an invitation for a user to join an organization.
Status: pending, accepted, expired, cancelled.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    email = Column(String, nullable=False)
    role = Column(String, nullable=False, default="member")
    token = Column(String, unique=True, nullable=False, index=True)
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, accepted, expired, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # How many times the invite email has been sent (initial send + resends).
    send_count = Column(Integer, nullable=False, default=1, server_default="1")
    # Timestamp of the most recent send attempt (initial send or resend).
    last_sent_at = Column(DateTime(timezone=True), nullable=True)
    # Filled in when the invite is accepted.
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    accepted_by_user_id = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    organization = relationship("Organization")
    invited_by = relationship("User", foreign_keys=[invited_by_id])
    accepted_by = relationship("User", foreign_keys=[accepted_by_user_id])
