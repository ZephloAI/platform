"""
SQLAlchemy ORM models.

Import all models here so they are registered with Base.metadata.
This is important for Alembic auto-generation to detect all tables.
"""

from app.models.base import Base
from app.models.user import User
from app.models.chatbot import Chatbot
from app.models.crawl_job import CrawlJob
from app.models.page import Page

__all__ = ["Base", "User", "Chatbot", "CrawlJob", "Page"]
