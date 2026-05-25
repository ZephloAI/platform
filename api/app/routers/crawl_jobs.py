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

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.chatbot_repository import ChatbotRepository
from app.schemas.crawl_job import (
    CrawlJobDetail,
    CrawlJobResponse,
    CrawlJobUpdate,
    CrawlStartRequest,
)
from app.services.auth_service import AuthService
from app.services.crawl_service import CrawlService

router = APIRouter(tags=["crawl-jobs"])


async def _resolve_chatbot(db: AsyncSession, agent_id: str):
    """Resolve a chatbot by its public_id. Raises 404 if not found."""
    repo = ChatbotRepository(db)
    chatbot = await repo.get_by_public_id(agent_id)
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return chatbot


@router.get("/api/agents/{agent_id}/discover/stream")
async def discover_stream(
    agent_id: str,
    website_url: str,
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream discovered URLs live as Server-Sent Events.

    The crawler spiders the site and emits each page as it's found; we proxy
    that stream straight through to the browser, which renders pages live.

    Auth is via a `token` query param (the JWT) because EventSource can't send
    an Authorization header. We validate it the same way as the admin WebSocket.

    Raises 401 for a bad token, 404 if the agent doesn't exist or isn't the
    user's.
    """
    user = await AuthService(db).get_current_user(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    chatbot = await _resolve_chatbot(db, agent_id)
    if chatbot.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    service = CrawlService(db)
    return StreamingResponse(
        service.stream_discovery(website_url),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post(
    "/api/agents/{agent_id}/crawl",
    response_model=CrawlJobResponse,
    status_code=201,
)
async def start_crawl(
    agent_id: str,
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
    chatbot = await _resolve_chatbot(db, agent_id)
    service = CrawlService(db)
    return await service.start_crawl(chatbot.id, user.id, body.selected_urls)


@router.post(
    "/api/agents/{agent_id}/recrawl",
    response_model=CrawlJobResponse,
    status_code=201,
)
async def recrawl(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Re-crawl a chatbot using its previously stored URLs.

    Requires the chatbot to have been crawled at least once before.
    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    Raises 400 if no previous crawl URLs are stored.
    """
    chatbot = await _resolve_chatbot(db, agent_id)
    service = CrawlService(db)
    return await service.start_recrawl(chatbot.id, user.id)


@router.get("/api/crawl-jobs/{crawl_job_id}", response_model=CrawlJobDetail)
async def get_crawl_job(
    crawl_job_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the status of a crawl job, including the live list of crawled pages.

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
    page = body.page.model_dump() if body.page else None
    return await service.update_crawl_status(
        crawl_job_id, body.status, body.pages_crawled, page, body.total_pages
    )
