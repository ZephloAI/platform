"""
Page repository - database access for the Page model.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.page import Page
from app.repositories.base import BaseRepository


class PageRepository(BaseRepository[Page]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Page)
