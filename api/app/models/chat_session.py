"""ChatSession model for tracking widget/dashboard chat sessions."""

import uuid

from sqlalchemy import Column, Integer, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    chatbot_id = Column(Integer, ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
