"""
Crawl API endpoints.

Provides:
  - GET  /discover  -- stream discovered URLs live as Server-Sent Events
  - POST /crawl     -- start a background crawl job
  - GET  /health    -- service health check
"""

import json
from typing import Optional

from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.orchestrator import run_crawl_job, run_document_job, run_text_job
from app.scrapy_runner import stream_discovery

router = APIRouter()


# -- Request / Response models --

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

@router.get("/discover")
async def discover(website_url: str, max_pages: int = 100):
    """
    Stream discovered URLs on a website as Server-Sent Events.

    Spiders the site and emits each page the moment it's found:
      - data: {"url": ..., "title": ...}   for every page
      - event: complete                    when discovery finishes
      - event: error                       if the crawl fails

    Streaming lets the dashboard show pages live over a single request,
    instead of waiting for the whole site to be spidered.
    """
    async def event_stream():
        count = 0
        try:
            async for page in stream_discovery(website_url, max_pages):
                # The spider reports an unreachable/blocked site as an error entry;
                # surface the real reason instead of finishing with zero pages.
                if "error" in page:
                    yield f"event: error\ndata: {json.dumps({'message': page['error']})}\n\n"
                    return
                count += 1
                yield f"data: {json.dumps(page)}\n\n"
            yield f"event: complete\ndata: {json.dumps({'count': count})}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


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


class ProcessDocumentRequest(BaseModel):
    """Request body for processing a PDF document."""
    chatbot_id: int
    chatbot_name: str
    document_id: int
    pdf_url: str
    callback_url: str


@router.post("/process-document")
async def process_document(request: ProcessDocumentRequest, background_tasks: BackgroundTasks):
    """Process a PDF document and index its content."""
    background_tasks.add_task(
        run_document_job,
        chatbot_id=request.chatbot_id,
        chatbot_name=request.chatbot_name,
        document_id=request.document_id,
        pdf_url=request.pdf_url,
        callback_url=request.callback_url,
    )
    return {"status": "started", "document_id": request.document_id}


class ProcessTextRequest(BaseModel):
    """Request body for processing a raw text snippet."""
    chatbot_id: int
    chatbot_name: str
    text_id: int
    title: str
    content: str
    callback_url: str


@router.post("/process-text")
async def process_text(request: ProcessTextRequest, background_tasks: BackgroundTasks):
    """Process a raw text snippet and index its content."""
    background_tasks.add_task(
        run_text_job,
        chatbot_id=request.chatbot_id,
        chatbot_name=request.chatbot_name,
        text_id=request.text_id,
        title=request.title,
        content=request.content,
        callback_url=request.callback_url,
    )
    return {"status": "started", "text_id": request.text_id}


@router.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}
