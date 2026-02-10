"""
Chatbot model.

Represents a chatbot tied to a specific website.
Status flow: pending -> crawling -> ready (or error)
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class Chatbot(Base):
    __tablename__ = "chatbots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    website_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, crawling, ready, error
    created_at = Column(DateTime, default=func.now())

    # Widget customization
    widget_icon = Column(String, nullable=True)       # Emoji or image URL
    widget_welcome = Column(String, nullable=True)    # Welcome message
    widget_position = Column(String, nullable=True)   # "right" or "left"
    quick_prompts = Column(JSON, nullable=True, default=[])

    # Relationships
    user = relationship("User", back_populates="chatbots")
    crawl_jobs = relationship(
        "CrawlJob", back_populates="chatbot", cascade="all, delete-orphan"
    )
    pages = relationship(
        "Page", back_populates="chatbot", cascade="all, delete-orphan"
    )
