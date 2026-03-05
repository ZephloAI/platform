"""
API Key repository - database access for the ApiKey model.
"""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey
from app.repositories.base import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKey]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, ApiKey)

    async def get_by_key(self, key: str) -> ApiKey | None:
        """Look up an API key by the full key string."""
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.key == key)
        )
        return result.scalar_one_or_none()

    async def get_all_for_chatbot(self, chatbot_id: int) -> list[ApiKey]:
        """Get all API keys for a given chatbot."""
        result = await self.db.execute(
            select(ApiKey).where(ApiKey.chatbot_id == chatbot_id)
        )
        return list(result.scalars().all())

    async def update_last_used(self, key_id: int) -> None:
        """Update the last_used_at timestamp for an API key."""
        from sqlalchemy import func

        await self.db.execute(
            update(ApiKey)
            .where(ApiKey.id == key_id)
            .values(last_used_at=func.now())
        )
        await self.db.commit()
