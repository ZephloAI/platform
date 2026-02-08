"""
CrawlJob-related Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CrawlJobResponse(BaseModel):
    """Schema for crawl job responses."""
    id: int
    chatbot_id: int
    status: str
    pages_crawled: int
    started_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CrawlJobUpdate(BaseModel):
    """Schema for the internal crawl job status update callback."""
    status: str
    pages_crawled: int = 0
