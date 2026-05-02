"""AgentText repository - database access for the AgentText model."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_text import AgentText
from app.repositories.base import BaseRepository


class AgentTextRepository(BaseRepository[AgentText]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, AgentText)
