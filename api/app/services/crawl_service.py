"""
Crawl service.

Manages crawl jobs: starting a new crawl (calls the crawler microservice),
updating crawl status (called by the crawler's callback), and retrieving
crawl job details.
"""

from datetime import datetime, timezone
from urllib.parse import urlparse

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

    async def stream_discovery(self, website_url: str):
        """
        Stream the crawler's live URL-discovery feed straight to the client.

        Opens a streaming GET to the crawler's /discover endpoint (which emits
        Server-Sent Events as it spiders the site) and re-yields each chunk.
        timeout=None because the stream stays open for the whole crawl.

        Ownership is verified by the caller before this generator runs.
        """
        client = get_client()
        async with client.stream(
            "GET",
            f"{settings.CRAWLER_SERVICE_URL}/discover",
            params={"website_url": website_url, "max_pages": 50},
            timeout=None,
        ) as response:
            async for chunk in response.aiter_bytes():
                yield chunk

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

        # Create the crawl job (record how many pages it will crawl for progress)
        crawl_job = await self.crawl_job_repo.create(
            chatbot_id=chatbot_id, total_pages=len(selected_urls)
        )

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
        self,
        crawl_job_id: int,
        job_status: str,
        pages_crawled: int,
        page: dict | None = None,
        total_pages: int | None = None,
    ) -> CrawlJob:
        """
        Update a crawl job's status (called by the crawler service callback).

        If `page` is given (the page just crawled, {url, title}), it's appended
        to the job's crawled_pages list so the dashboard can show pages live.

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

        # Keep the real total in sync (re-crawl re-discovers, so it can change)
        if total_pages is not None:
            update_fields["total_pages"] = total_pages

        # Append the just-crawled page (reassign a new list so SQLAlchemy
        # detects the change on the JSON column)
        if page is not None:
            update_fields["crawled_pages"] = list(crawl_job.crawled_pages or []) + [page]

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

    @staticmethod
    def _discovery_seed(chatbot) -> str | None:
        """
        The URL to re-discover from on a re-crawl.

        Prefer the chatbot's saved website_url; otherwise fall back to the root
        of the first previously-crawled URL, so agents crawled before we stored
        a website_url still re-crawl correctly.
        """
        if chatbot.website_url:
            return chatbot.website_url
        for url in (chatbot.crawled_urls or []):
            parsed = urlparse(url)
            if parsed.scheme and parsed.netloc:
                return f"{parsed.scheme}://{parsed.netloc}/"
        return None

    async def start_recrawl(self, chatbot_id: int, user_id: int) -> CrawlJob:
        """Re-crawl a chatbot: re-discover its site, then crawl (user-initiated)."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        if not self._discovery_seed(chatbot):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No website to re-crawl. Crawl a website first.",
            )
        return await self._do_recrawl(chatbot)

    async def start_auto_recrawl(self, chatbot_id: int) -> CrawlJob | None:
        """Re-crawl a chatbot (called by scheduler, no ownership check)."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or not self._discovery_seed(chatbot):
            return None
        return await self._do_recrawl(chatbot)

    async def _do_recrawl(self, chatbot) -> CrawlJob:
        """
        Shared re-crawl logic: tell the crawler to re-discover the site (no
        selected_urls), then crawl what it finds. total_pages starts as an
        estimate from the last crawl and is corrected once discovery completes.
        """
        crawl_job = await self.crawl_job_repo.create(
            chatbot_id=chatbot.id, total_pages=len(chatbot.crawled_urls or [])
        )
        await self.chatbot_repo.update(chatbot.id, status="crawling")

        crawler_payload = {
            "crawl_job_id": crawl_job.id,
            "chatbot_id": chatbot.id,
            "chatbot_name": chatbot.name,
            "website_url": self._discovery_seed(chatbot) or "",
            "callback_url": f"{settings.API_CALLBACK_URL}/api/internal/crawl-jobs/{crawl_job.id}",
            # No selected_urls -> the crawler re-discovers from website_url first.
            "selected_urls": None,
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
