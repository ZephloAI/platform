"""
Crawl API endpoints.

Provides:
  - POST /discover  -- discover all URLs on a site (synchronous)
  - POST /crawl     -- start a background crawl job
  - GET  /health    -- service health check
"""

from typing import Optional

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from app.crawler import discover_urls
from app.orchestrator import run_crawl_job

router = APIRouter()


# -- Request / Response models --

class DiscoverRequest(BaseModel):
    """Request body for URL discovery."""
    website_url: str
    max_pages: int = 50


class DiscoveredUrl(BaseModel):
    """A single discovered URL with its page title."""
    url: str
    title: str = ""


class DiscoverResponse(BaseModel):
    """Response containing all discovered URLs on a site."""
    urls: list[DiscoveredUrl]


class CrawlRequest(BaseModel):
    """Request body for starting a crawl job."""
    chatbot_id: int
    chatbot_name: str
    website_url: str
    crawl_job_id: int
    callback_url: str
    # Optional: if provided, only these URLs will be crawled instead of
    # spidering the whole site. Used after the user picks pages from /discover.
    selected_urls: Optional[list[str]] = None


class CrawlResponse(BaseModel):
    """Response returned when a crawl job is started."""
    status: str
    crawl_job_id: int


# -- Endpoints --

@router.post("/discover", response_model=DiscoverResponse)
async def discover(request: DiscoverRequest):
    """
    Discover all reachable URLs on a website.

    Spiders the site and returns a list of URLs with page titles.
    This is synchronous -- the caller waits until discovery is done.
    Use the results to let the user pick which pages to crawl.
    """
    urls = await discover_urls(
        website_url=request.website_url,
        max_pages=request.max_pages,
    )
    return DiscoverResponse(urls=[DiscoveredUrl(**u) for u in urls])


@router.post("/crawl", response_model=CrawlResponse)
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    """
    Start a website crawl job.

    The crawl runs in the background. Progress and completion are
    reported back to the API service via the callback_url.

    If selected_urls is provided, only those specific pages are crawled.
    Otherwise the whole site is spidered as before.
    """
    background_tasks.add_task(
        run_crawl_job,
        chatbot_id=request.chatbot_id,
        chatbot_name=request.chatbot_name,
        website_url=request.website_url,
        crawl_job_id=request.crawl_job_id,
        callback_url=request.callback_url,
        selected_urls=request.selected_urls,
    )

    return CrawlResponse(status="started", crawl_job_id=request.crawl_job_id)


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}
