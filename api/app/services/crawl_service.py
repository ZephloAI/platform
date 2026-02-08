"""
Crawl service.

Manages crawl jobs: starting a new crawl (calls the crawler microservice),
updating crawl status (called by the crawler's callback), and retrieving
crawl job details.
"""

from datetime import datetime

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.crawl_job import CrawlJob
from app.repositories.chatbot_repository import ChatbotRepository
from app.repositories.crawl_job_repository import CrawlJobRepository


class CrawlService:
    def __init__(self, db: AsyncSession):
        self.crawl_job_repo = CrawlJobRepository(db)
        self.chatbot_repo = ChatbotRepository(db)

    async def start_crawl(self, chatbot_id: int, user_id: int) -> CrawlJob:
        """
        Start a new crawl for a chatbot.

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
                detail="Chatbot not found",
            )

        # Create the crawl job
        crawl_job = await self.crawl_job_repo.create(chatbot_id=chatbot_id)

        # Mark the chatbot as "crawling"
        await self.chatbot_repo.update(chatbot_id, status="crawling")

        # Call the crawler service asynchronously (fire-and-forget style)
        # If the crawler is down, we still return the job; it will be picked up later
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.CRAWLER_SERVICE_URL}/crawl",
                    json={
                        "crawl_job_id": crawl_job.id,
                        "chatbot_id": chatbot_id,
                        "chatbot_name": chatbot.name,
                        "website_url": chatbot.website_url,
                        "callback_url": f"{settings.API_CALLBACK_URL}/api/internal/crawl-jobs/{crawl_job.id}",
                    },
                    timeout=10.0,
                )
        except httpx.RequestError:
            # Crawler service is unreachable - job stays "pending"
            # The crawler can pick it up later or be retried manually
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
            update_fields["completed_at"] = datetime.utcnow()

        updated_job = await self.crawl_job_repo.update(crawl_job_id, **update_fields)

        # Update the parent chatbot's status
        if job_status == "completed":
            await self.chatbot_repo.update(crawl_job.chatbot_id, status="ready")
        elif job_status == "failed":
            await self.chatbot_repo.update(crawl_job.chatbot_id, status="error")

        return updated_job

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
