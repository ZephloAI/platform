"""
Crawl jobs router - start crawls and check status.

Includes both authenticated endpoints (for users) and an internal
callback endpoint (for the crawler service to report status updates).

Flow:
  Router receives request
  -> CrawlService handles business logic
  -> CrawlJobRepository + ChatbotRepository access the database
  -> Response returned to client
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.crawl_job import (
    CrawlJobResponse,
    CrawlJobUpdate,
    CrawlStartRequest,
    DiscoverRequest,
    DiscoverResponse,
)
from app.services.crawl_service import CrawlService

router = APIRouter(tags=["crawl-jobs"])


@router.post(
    "/api/chatbots/{chatbot_id}/discover",
    response_model=DiscoverResponse,
)
async def discover_urls(
    chatbot_id: int,
    body: DiscoverRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Discover URLs on a website.

    Accepts a website_url in the request body, calls the crawler service
    to spider the site, and returns discovered page URLs. The user can
    then select which pages to crawl.

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    Raises 502 if the crawler service is unreachable.
    """
    service = CrawlService(db)
    return await service.discover_urls(chatbot_id, user.id, body.website_url)


@router.post(
    "/api/chatbots/{chatbot_id}/crawl",
    response_model=CrawlJobResponse,
    status_code=201,
)
async def start_crawl(
    chatbot_id: int,
    body: CrawlStartRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new crawl for a chatbot with selected URLs.

    Creates a crawl job record and sends a request to the crawler service.
    The chatbot status changes to "crawling".

    Requires a list of selected_urls to crawl.

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    """
    service = CrawlService(db)
    return await service.start_crawl(chatbot_id, user.id, body.selected_urls)


@router.get("/api/crawl-jobs/{crawl_job_id}", response_model=CrawlJobResponse)
async def get_crawl_job(
    crawl_job_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the status of a crawl job.

    Requires authentication to prevent unauthorized access.
    """
    service = CrawlService(db)
    return await service.get_crawl_job(crawl_job_id)


# -- Internal callback endpoint (no auth required) --
# Called by the crawler service to update crawl job status


@router.patch(
    "/api/internal/crawl-jobs/{crawl_job_id}",
    response_model=CrawlJobResponse,
)
async def update_crawl_status(
    crawl_job_id: int,
    body: CrawlJobUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Internal endpoint: update crawl job status.

    Called by the crawler microservice to report progress.
    No authentication required (internal service-to-service call).

    When status is "completed", the parent chatbot becomes "ready".
    When status is "failed", the parent chatbot becomes "error".
    """
    service = CrawlService(db)
    return await service.update_crawl_status(
        crawl_job_id, body.status, body.pages_crawled
    )
