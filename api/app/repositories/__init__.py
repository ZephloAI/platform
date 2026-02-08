"""
Repository layer - handles all database access.

Each repository wraps a SQLAlchemy model and provides
async CRUD methods. Services should NEVER access the
database directly; they always go through a repository.
"""

from app.repositories.base import BaseRepository
from app.repositories.user_repository import UserRepository
from app.repositories.chatbot_repository import ChatbotRepository
from app.repositories.crawl_job_repository import CrawlJobRepository
from app.repositories.page_repository import PageRepository

__all__ = [
    "BaseRepository",
    "UserRepository",
    "ChatbotRepository",
    "CrawlJobRepository",
    "PageRepository",
]
