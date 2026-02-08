"""
CrawlJob repository - database access for the CrawlJob model.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.crawl_job import CrawlJob
from app.repositories.base import BaseRepository


class CrawlJobRepository(BaseRepository[CrawlJob]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, CrawlJob)
