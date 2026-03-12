"""ChatSession model for tracking widget/dashboard chat sessions."""

import uuid

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    chatbot_id = Column(Integer, ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False)
    mode = Column(String, default="ai", server_default="ai", nullable=False)  # "ai" or "person"
    is_unread = Column(Boolean, default=False, server_default="false", nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    visitor_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), onupdate=text("now()"))

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")
