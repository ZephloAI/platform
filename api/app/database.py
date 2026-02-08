"""
Database connection setup.

Creates an async SQLAlchemy engine and session factory.
Provides a dependency (get_db) that FastAPI endpoints use
to get a database session per request.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

# Create the async engine (connects to PostgreSQL via asyncpg)
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# Session factory - creates new AsyncSession instances
# expire_on_commit=False so we can access attributes after commit
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    """
    FastAPI dependency that provides a database session.

    Usage in a router:
        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically closed when the request finishes.
    """
    async with async_session() as session:
        yield session
