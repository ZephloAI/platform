"""
CrawlJob model.

Represents a single crawl operation for a chatbot's website.
Status flow: pending -> in_progress -> completed (or failed)
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class CrawlJob(Base):
    __tablename__ = "crawl_jobs"

    id = Column(Integer, primary_key=True, index=True)
    chatbot_id = Column(Integer, ForeignKey("chatbots.id"), nullable=False)
    status = Column(String, default="pending")  # pending, in_progress, completed, failed
    pages_crawled = Column(Integer, default=0)
    # Total pages this job will crawl (set at creation from the selected URLs),
    # used for the live progress fraction on the dashboard.
    total_pages = Column(Integer, nullable=True)
    # The pages crawled so far as [{"url", "title"}], appended one per callback.
    # Drives the live "pages crawled" list; collapses to a summary when done.
    crawled_pages = Column(JSON, nullable=True, default=list)
    started_at = Column(DateTime(timezone=True), default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Each crawl job belongs to one chatbot
    chatbot = relationship("Chatbot", back_populates="crawl_jobs")
