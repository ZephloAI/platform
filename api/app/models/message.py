"""Message model for storing chat messages."""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "user", "assistant", "admin"
    content = Column(Text, nullable=False)
    is_resolved = Column(Boolean, nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))

    session = relationship("ChatSession", back_populates="messages")
