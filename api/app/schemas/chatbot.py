"""
Chatbot-related Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, HttpUrl

from app.schemas.crawl_job import CrawlJobResponse


class ChatbotCreate(BaseModel):
    """Schema for creating a new chatbot."""
    name: str
    website_url: HttpUrl


class ChatbotResponse(BaseModel):
    """Schema for chatbot list/detail responses."""
    id: int
    name: str
    website_url: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatbotDetailResponse(ChatbotResponse):
    """Extended chatbot response that includes crawl job history."""
    crawl_jobs: list[CrawlJobResponse] = []
