"""
Chatbot repository - database access for the Chatbot model.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chatbot import Chatbot
from app.repositories.base import BaseRepository


class ChatbotRepository(BaseRepository[Chatbot]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Chatbot)

    async def get_with_crawl_jobs(self, chatbot_id: int) -> Chatbot | None:
        """
        Get a chatbot with its crawl_jobs eagerly loaded.
        Used for the detail endpoint so we avoid lazy-load issues.
        """
        result = await self.db.execute(
            select(Chatbot)
            .where(Chatbot.id == chatbot_id)
            .options(selectinload(Chatbot.crawl_jobs), selectinload(Chatbot.documents))
        )
        return result.scalar_one_or_none()
