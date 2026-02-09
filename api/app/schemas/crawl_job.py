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


class CrawlStartRequest(BaseModel):
    """Request body for starting a crawl with pre-selected URLs."""
    selected_urls: list[str]


class DiscoverRequest(BaseModel):
    """Request body for URL discovery. Requires the website URL to spider."""
    website_url: str


class DiscoveredUrl(BaseModel):
    """A single URL found during site discovery."""
    url: str
    title: str


class DiscoverResponse(BaseModel):
    """Response from the URL discovery endpoint."""
    urls: list[DiscoveredUrl]
