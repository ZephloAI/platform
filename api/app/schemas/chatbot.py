"""
Chatbot-related Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.crawl_job import CrawlJobResponse


class ChatbotCreate(BaseModel):
    """Schema for creating a new chatbot. Only name is required."""
    name: str


class QuickPrompt(BaseModel):
    """A single quick prompt button for the widget."""
    title: str
    link: str | None = None
    prompt: str | None = None


class ChatbotResponse(BaseModel):
    """Schema for chatbot list/detail responses."""
    id: int
    name: str
    website_url: str | None = None
    status: str
    created_at: datetime
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None

    model_config = ConfigDict(from_attributes=True)


class ChatbotDetailResponse(ChatbotResponse):
    """Extended chatbot response that includes crawl job history."""
    crawl_jobs: list[CrawlJobResponse] = []


class WidgetSettingsUpdate(BaseModel):
    """Schema for updating widget customization settings."""
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None


class WidgetSettingsResponse(BaseModel):
    """Schema for widget settings responses."""
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None

    model_config = ConfigDict(from_attributes=True)


class PublicWidgetConfig(BaseModel):
    """Public config returned to the embeddable widget. No sensitive data."""
    chatbot_id: int
    name: str
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None
