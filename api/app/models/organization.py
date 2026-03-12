"""
Organization model.

Represents a team/workspace that groups users, chatbots, and API keys.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
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

    created_by = relationship("User", foreign_keys=[created_by_id])
    members = relationship(
        "OrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    chatbots = relationship("Chatbot", back_populates="organization")
    api_keys = relationship("ApiKey", back_populates="organization")
