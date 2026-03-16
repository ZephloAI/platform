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
from app.models.chat_session import ChatSession
from app.models.message import Message
from app.models.api_key import ApiKey
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.invitation import Invitation
from app.models.document import Document

__all__ = [
    "Base",
    "User",
    "Chatbot",
    "CrawlJob",
    "Page",
    "ChatSession",
    "Message",
    "ApiKey",
    "Organization",
    "OrganizationMember",
    "Invitation",
    "Document",
]
