"""
OAuth provider model.

Stores the link between a user and an external OAuth provider (Google, Microsoft, etc.).
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class UserOAuthProvider(Base):
    __tablename__ = "user_oauth_providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False)
    provider_user_id = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())

    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_provider_provider_user_id"),
    )

    user = relationship("User", back_populates="oauth_providers")
