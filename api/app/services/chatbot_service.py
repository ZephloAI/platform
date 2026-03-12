"""
Chatbot service.

Business logic for chatbot CRUD operations.
Enforces organization membership checks so users can only access
chatbots within their organization.
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chatbot import Chatbot
from app.repositories.chatbot_repository import ChatbotRepository
from app.schemas.chatbot import ChatbotUpdate, WidgetSettingsUpdate


class ChatbotService:
    def __init__(self, db: AsyncSession):
        self.chatbot_repo = ChatbotRepository(db)

    async def list_chatbots(
        self, user_id: int, organization_id: int | None = None
    ) -> list[Chatbot]:
        """
        Get chatbots. If organization_id is provided, return chatbots
        for that org. Otherwise fall back to user_id for backward compat.
        """
        if organization_id:
            return await self.chatbot_repo.get_all(organization_id=organization_id)
        return await self.chatbot_repo.get_all(user_id=user_id)

    async def create_chatbot(
        self,
        user_id: int,
        name: str,
        description: str | None = None,
        instructions: str | None = None,
        organization_id: int | None = None,
    ) -> Chatbot:
        """Create a new chatbot for the given user/org."""
        return await self.chatbot_repo.create(
            user_id=user_id,
            name=name,
            description=description,
            instructions=instructions,
            organization_id=organization_id,
        )

    async def update_chatbot(
        self, chatbot_id: int, user_id: int, update: ChatbotUpdate
    ) -> Chatbot:
        """Update chatbot general settings with ownership check."""
        chatbot = await self._get_owned_chatbot(chatbot_id, user_id)
        update_data = update.model_dump(exclude_unset=True)
        return await self.chatbot_repo.update(chatbot_id, **update_data)

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
                detail="Agent not found",
            )
        return chatbot

    async def get_chatbot_for_org(self, chatbot_id: int, org_id: int) -> Chatbot:
        """
        Get a chatbot by ID with organization check.
        Raises 404 if not found or not in the organization.
        """
        chatbot = await self.chatbot_repo.get_with_crawl_jobs(chatbot_id)
        if not chatbot or chatbot.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        return chatbot

    async def update_widget_settings(
        self, chatbot_id: int, user_id: int, settings: WidgetSettingsUpdate
    ) -> Chatbot:
        """Update widget customization settings with ownership check."""
        chatbot = await self._get_owned_chatbot(chatbot_id, user_id)
        update_data = settings.model_dump(exclude_unset=True)
        return await self.chatbot_repo.update(chatbot_id, **update_data)

    async def delete_chatbot(self, chatbot_id: int, user_id: int) -> bool:
        """
        Delete a chatbot with ownership check.

        Raises 404 if not found or not owned by the user.
        """
        chatbot = await self._get_owned_chatbot(chatbot_id, user_id)
        return await self.chatbot_repo.delete(chatbot_id)

    async def _get_owned_chatbot(self, chatbot_id: int, user_id: int) -> Chatbot:
        """Check user owns the chatbot (by user_id or org membership)."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        return chatbot
