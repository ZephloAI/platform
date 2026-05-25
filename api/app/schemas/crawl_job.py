"""
CrawlJob-related Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CrawlJobResponse(BaseModel):
    """Schema for crawl job responses (used in the chatbot's crawl history list)."""
    id: int
    chatbot_id: int
    status: str
    pages_crawled: int
    started_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class CrawledPage(BaseModel):
    """A single page recorded as crawled."""
    url: str
    title: str = ""


class CrawlJobDetail(CrawlJobResponse):
    """Detailed crawl job (single-job endpoint): includes the live page list.

    Kept separate from CrawlJobResponse so the chatbot's crawl-history list
    stays lean — only the dedicated /crawl-jobs/{id} endpoint ships the pages.
    """
    total_pages: int | None = None
    crawled_pages: list[CrawledPage] | None = None


class CrawlJobUpdate(BaseModel):
    """Schema for the internal crawl job status update callback."""
    status: str
    pages_crawled: int = 0
    # Real page count reported by the crawler (a re-crawl's total can differ
    # from the original once the site is re-discovered).
    total_pages: int | None = None
    # The page just crawled (in_progress callbacks). Appended to crawled_pages.
    page: CrawledPage | None = None


class CrawlStartRequest(BaseModel):
    """Request body for starting a crawl with pre-selected URLs."""
    selected_urls: list[str]
