"""
API Key model.

Represents an API key tied to a specific chatbot.
Used to authenticate widget requests to the public API.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(
        Integer, ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=True
    )
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    key = Column(String, unique=True, index=True, nullable=False)
    key_prefix = Column(String(8), nullable=False)
    name = Column(String, default="Default")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_used_at = Column(DateTime, nullable=True)

    # Relationships
    chatbot = relationship("Chatbot")
    organization = relationship("Organization", back_populates="api_keys")
