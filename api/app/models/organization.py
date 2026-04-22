"""
Organization model.

Represents a team/workspace that groups users, chatbots, and API keys.
"""

from sqlalchemy import BigInteger, Boolean, Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    size = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    # Plan + limits. NULL on a limit column means "unlimited".
    plan = Column(String, nullable=False, server_default="free")
    is_suspended = Column(Boolean, nullable=False, server_default="false")
    max_users = Column(Integer, nullable=True)
    max_agents = Column(Integer, nullable=True)
    max_tokens_per_period = Column(BigInteger, nullable=True)

    # Token usage aggregates. The agent service bumps tokens_used_in_period
    # atomically per call; read-side never scans agent_token_usage rows.
    token_period = Column(String, nullable=False, server_default="monthly")
    token_period_start = Column(DateTime, nullable=True)
    tokens_used_in_period = Column(BigInteger, nullable=False, server_default="0")

    created_by = relationship("User", foreign_keys=[created_by_id])
    members = relationship(
        "OrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    chatbots = relationship("Chatbot", back_populates="organization")
    api_keys = relationship("ApiKey", back_populates="organization")
