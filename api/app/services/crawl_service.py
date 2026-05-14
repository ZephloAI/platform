"""
Crawl service.

Manages crawl jobs: starting a new crawl (calls the crawler microservice),
updating crawl status (called by the crawler's callback), and retrieving
crawl job details.
"""

from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.http_client import get_client
from app.models.crawl_job import CrawlJob
from app.repositories.chatbot_repository import ChatbotRepository
from app.repositories.crawl_job_repository import CrawlJobRepository


class CrawlService:
    def __init__(self, db: AsyncSession):
        self.crawl_job_repo = CrawlJobRepository(db)
        self.chatbot_repo = ChatbotRepository(db)

    async def discover_urls(
        self, chatbot_id: int, user_id: int, website_url: str
    ) -> dict:
        """
        Discover URLs on a website.

        Proxies the request to the crawler service's /discover endpoint
        and returns the list of discovered URLs. The website_url is provided
        by the caller (not stored on the chatbot).

        Raises 404 if chatbot not found or not owned by user.
        Raises 502 if the crawler service is unreachable or returns an error.
        """
        # Verify ownership
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        # Call the crawler service's discover endpoint
        try:
            client = get_client()
            response = await client.post(
                f"{settings.CRAWLER_SERVICE_URL}/discover",
                json={
                    "website_url": website_url,
                    "max_pages": 50,
                },
                timeout=300.0,
            )
            response.raise_for_status()
            return response.json()
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Crawler service is unreachable",
            )
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Crawler service returned an error",
            )

    async def start_crawl(
        self,
        chatbot_id: int,
        user_id: int,
        selected_urls: list[str],
    ) -> CrawlJob:
        """
        Start a new crawl for a chatbot with selected URLs.

        Steps:
        1. Verify the chatbot exists and belongs to the user
        2. Create a crawl_job record in the database
        3. Update the chatbot status to "crawling"
        4. Call the external crawler service via HTTP
        5. Return the new crawl job

        Raises 404 if chatbot not found or not owned by user.
        """
        # Verify ownership
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        # Create the crawl job
        crawl_job = await self.crawl_job_repo.create(chatbot_id=chatbot_id)

        # Mark the chatbot as "crawling" and save selected URLs for re-crawl
        await self.chatbot_repo.update(chatbot_id, status="crawling", crawled_urls=selected_urls)

        # Build the crawler request payload
        crawler_payload = {
            "crawl_job_id": crawl_job.id,
            "chatbot_id": chatbot_id,
            "chatbot_name": chatbot.name,
            "website_url": chatbot.website_url or "",
            "callback_url": f"{settings.API_CALLBACK_URL}/api/internal/crawl-jobs/{crawl_job.id}",
            "selected_urls": selected_urls,
        }

        # Call the crawler service asynchronously (fire-and-forget style)
        try:
            client = get_client()
            await client.post(
                f"{settings.CRAWLER_SERVICE_URL}/crawl",
                json=crawler_payload,
                timeout=10.0,
            )
        except httpx.RequestError:
            # Crawler service is unreachable - job stays "pending"
            pass

        return crawl_job

    async def update_crawl_status(
        self, crawl_job_id: int, job_status: str, pages_crawled: int
    ) -> CrawlJob:
        """
        Update a crawl job's status (called by the crawler service callback).

        Also updates the chatbot status:
        - "completed" crawl -> chatbot becomes "ready"
        - "failed" crawl -> chatbot becomes "error"
        """
        crawl_job = await self.crawl_job_repo.get_by_id(crawl_job_id)
        if not crawl_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crawl job not found",
            )

        # Build update fields
        update_fields = {
            "status": job_status,
            "pages_crawled": pages_crawled,
        }

        # Set completed_at timestamp for terminal states
        if job_status in ("completed", "failed"):
            update_fields["completed_at"] = datetime.now(timezone.utc)

        updated_job = await self.crawl_job_repo.update(crawl_job_id, **update_fields)

        # Update the parent chatbot's status
        if job_status == "completed":
            await self.chatbot_repo.update(
                crawl_job.chatbot_id,
                status="ready",
                last_crawled_at=datetime.now(timezone.utc),
            )
        elif job_status == "failed":
            await self.chatbot_repo.update(crawl_job.chatbot_id, status="error")

        return updated_job

    async def start_recrawl(self, chatbot_id: int, user_id: int) -> CrawlJob:
        """Start a re-crawl using stored URLs (user-initiated, with ownership check)."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        if not chatbot.crawled_urls:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No previous crawl URLs found. Crawl the website first.",
            )
        return await self._do_recrawl(chatbot)

    async def start_auto_recrawl(self, chatbot_id: int) -> CrawlJob | None:
        """Start a re-crawl using stored URLs (called by scheduler, no ownership check)."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or not chatbot.crawled_urls:
            return None
        return await self._do_recrawl(chatbot)

    async def _do_recrawl(self, chatbot) -> CrawlJob:
        """Shared logic for re-crawling a chatbot using its stored URLs."""
        crawl_job = await self.crawl_job_repo.create(chatbot_id=chatbot.id)
        await self.chatbot_repo.update(chatbot.id, status="crawling")

        crawler_payload = {
            "crawl_job_id": crawl_job.id,
            "chatbot_id": chatbot.id,
            "chatbot_name": chatbot.name,
            "website_url": chatbot.website_url or "",
            "callback_url": f"{settings.API_CALLBACK_URL}/api/internal/crawl-jobs/{crawl_job.id}",
            "selected_urls": chatbot.crawled_urls,
        }

        try:
            client = get_client()
            await client.post(
                f"{settings.CRAWLER_SERVICE_URL}/crawl",
                json=crawler_payload,
                timeout=10.0,
            )
        except httpx.RequestError:
            pass

        return crawl_job

    async def get_crawl_job(self, crawl_job_id: int) -> CrawlJob:
        """
        Get a crawl job by ID.

        Raises 404 if not found.
        """
        crawl_job = await self.crawl_job_repo.get_by_id(crawl_job_id)
        if not crawl_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Crawl job not found",
            )
        return crawl_job
