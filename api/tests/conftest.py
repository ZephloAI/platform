"""
Shared pytest fixtures for the api service.

Spins up an in-memory SQLite database per test with the full SQLAlchemy
schema from `app.models`. These are unit tests for enforcement logic, so
we do not need Postgres-specific features here.
"""

import asyncio
import datetime as dt

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models import (  # noqa: F401  (ensure all tables are registered)
    AgentTokenUsage,
    ApiKey,
    AuditLog,
    Base,
    Chatbot,
    Invitation,
    Organization,
    OrganizationMember,
    User,
)


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    """One in-memory SQLite database per test."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", future=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def user(db):
    u = User(email="owner@example.com", password_hash="x")
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


@pytest_asyncio.fixture
async def org(db, user):
    o = Organization(
        name="Acme",
        slug="acme",
        created_by_id=user.id,
        plan="free",
        is_suspended=False,
        token_period="monthly",
        token_period_start=dt.datetime.now(dt.timezone.utc),
        tokens_used_in_period=0,
    )
    db.add(o)
    await db.commit()
    await db.refresh(o)
    db.add(OrganizationMember(organization_id=o.id, user_id=user.id, role="creator"))
    await db.commit()
    return o
