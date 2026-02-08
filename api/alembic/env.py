"""
Alembic environment configuration.

This file configures Alembic to work with our async SQLAlchemy setup.
It reads the DATABASE_URL from the .env file and uses the Base metadata
from our models to auto-generate migrations.
"""

import asyncio
import sys
from pathlib import Path
from logging.config import fileConfig

# Add the project root (/app) to Python path so 'app' package is importable
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# Load our app config to get DATABASE_URL
from app.config import settings

# Import Base and all models so Alembic can detect them
from app.models.base import Base
from app.models.user import User  # noqa: F401
from app.models.chatbot import Chatbot  # noqa: F401
from app.models.crawl_job import CrawlJob  # noqa: F401
from app.models.page import Page  # noqa: F401

# Alembic Config object (provides access to alembic.ini values)
config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# This is the metadata Alembic uses to auto-generate migrations
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL without connecting)."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Helper: run migrations using a given connection."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to the database)."""
    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


# Decide which mode to run based on Alembic context
if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
