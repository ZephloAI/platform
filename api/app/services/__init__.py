"""
Service layer - business logic.

Services sit between routers and repositories.
They handle validation, authorization, external API calls,
and any logic that doesn't belong in a simple CRUD operation.
"""

from app.services.auth_service import AuthService
from app.services.chatbot_service import ChatbotService
from app.services.crawl_service import CrawlService

__all__ = ["AuthService", "ChatbotService", "CrawlService"]
