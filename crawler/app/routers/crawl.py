"""
Crawl API endpoints.

Provides the POST /crawl endpoint that starts a background crawl job
and a GET /health endpoint for service health checks.
"""

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from app.orchestrator import run_crawl_job

router = APIRouter()


# -- Request / Response models --

class CrawlRequest(BaseModel):
    """Request body for starting a crawl job."""
    chatbot_id: int
    chatbot_name: str
    website_url: str
    crawl_job_id: int
    callback_url: str


class CrawlResponse(BaseModel):
    """Response returned when a crawl job is started."""
    status: str
    crawl_job_id: int


# -- Endpoints --

@router.post("/crawl", response_model=CrawlResponse)
async def start_crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    """
    Start a website crawl job.

    The crawl runs in the background. Progress and completion are
    reported back to the API service via the callback_url.
    """
    background_tasks.add_task(
        run_crawl_job,
        chatbot_id=request.chatbot_id,
        chatbot_name=request.chatbot_name,
        website_url=request.website_url,
        crawl_job_id=request.crawl_job_id,
        callback_url=request.callback_url,
    )

    return CrawlResponse(status="started", crawl_job_id=request.crawl_job_id)


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}
