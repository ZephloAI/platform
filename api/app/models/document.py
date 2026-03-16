"""Document model for uploaded PDF knowledge sources."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    s3_url = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    status = Column(String, default="pending")  # pending, processing, ready, error
    chunks_indexed = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=func.now())
    processed_at = Column(DateTime, nullable=True)

    chatbot = relationship("Chatbot", back_populates="documents")
