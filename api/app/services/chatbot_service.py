"""
Chatbot service.

Business logic for chatbot CRUD operations.
Enforces ownership checks so users can only access their own chatbots.
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chatbot import Chatbot
from app.repositories.chatbot_repository import ChatbotRepository


class ChatbotService:
    def __init__(self, db: AsyncSession):
        self.chatbot_repo = ChatbotRepository(db)

    async def list_chatbots(self, user_id: int) -> list[Chatbot]:
        """Get all chatbots owned by the given user."""
        return await self.chatbot_repo.get_all(user_id=user_id)

    async def create_chatbot(
        self, user_id: int, name: str, website_url: str
    ) -> Chatbot:
        """Create a new chatbot for the given user."""
        return await self.chatbot_repo.create(
            user_id=user_id,
            name=name,
            website_url=website_url,
        )

    async def get_chatbot(self, chatbot_id: int, user_id: int) -> Chatbot:
        """
        Get a chatbot by ID with ownership check.

        Raises 404 if not found or not owned by the user.
        Returns the chatbot with crawl_jobs eagerly loaded.
        """
        chatbot = await self.chatbot_repo.get_with_crawl_jobs(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chatbot not found",
            )
        return chatbot

    async def delete_chatbot(self, chatbot_id: int, user_id: int) -> bool:
        """
        Delete a chatbot with ownership check.

        Raises 404 if not found or not owned by the user.
        """
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chatbot not found",
            )
        return await self.chatbot_repo.delete(chatbot_id)
