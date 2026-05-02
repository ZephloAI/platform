"""
Page model.

Represents a single crawled page from a chatbot's website.
Stores the URL, title, and text content extracted by the crawler.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    crawled_at = Column(DateTime(timezone=True), default=func.now())

    # Each page belongs to one chatbot
    chatbot = relationship("Chatbot", back_populates="pages")
