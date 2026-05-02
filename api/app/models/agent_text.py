"""AgentText model for raw text knowledge sources pasted by the user."""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class AgentText(Base):
    __tablename__ = "agent_texts"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, processing, ready, error
    chunks_indexed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    chatbot = relationship("Chatbot", back_populates="agent_texts")