"""
Base repository with generic CRUD operations.

All specific repositories inherit from this class.
It provides get_by_id, get_all, create, update, and delete
so you don't have to rewrite them for every model.
"""

from typing import Generic, TypeVar, Type

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

# T is a type variable bound to our Base model class
T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """
    Generic async repository for CRUD operations.

    Usage:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: AsyncSession):
                super().__init__(db, User)
    """

    def __init__(self, db: AsyncSession, model: Type[T]):
        self.db = db
        self.model = model

    async def get_by_id(self, id: int) -> T | None:
        """Get a single record by its primary key."""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, **filters) -> list[T]:
        """
        Get all records, optionally filtered by column values.

        Example:
            await repo.get_all(user_id=1, status="active")
        """
        query = select(self.model)
        for key, value in filters.items():
            query = query.where(getattr(self.model, key) == value)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> T:
        """
        Create a new record.

        Example:
            user = await repo.create(email="a@b.com", password_hash="...")
        """
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.commit()
        await self.db.refresh(instance)
        return instance

    async def update(self, id: int, **kwargs) -> T | None:
        """
        Update a record by ID. Returns None if not found.

        Example:
            await repo.update(1, status="ready")
        """
        instance = await self.get_by_id(id)
        if instance:
            for key, value in kwargs.items():
                setattr(instance, key, value)
            await self.db.commit()
            await self.db.refresh(instance)
        return instance

    async def delete(self, id: int) -> bool:
        """Delete a record by ID. Returns True if deleted, False if not found."""
        instance = await self.get_by_id(id)
        if instance:
            await self.db.delete(instance)
            await self.db.commit()
            return True
        return False
