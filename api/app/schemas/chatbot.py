"""
Chatbot-related Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.crawl_job import CrawlJobResponse
from app.schemas.document import DocumentResponse
from app.schemas.agent_text import AgentTextResponse


class ChatbotCreate(BaseModel):
    """Schema for creating a new chatbot. Only name is required."""
    name: str
    description: str | None = None
    instructions: str | None = None
    organization_id: int | None = None


class ChatbotUpdate(BaseModel):
    """Schema for updating chatbot general settings."""
    name: str | None = None
    description: str | None = None
    instructions: str | None = None
    is_active: bool | None = None
    auto_recrawl_enabled: bool | None = None
    recrawl_interval_hours: int | None = None


class MCPServer(BaseModel):
    """An MCP server configuration for the chatbot."""
    name: str
    transport: str = "sse"  # "sse" or "streamable-http"
    url: str
    headers: dict[str, str] | None = None
    enabled: bool = True


class QuickPrompt(BaseModel):
    """A single quick prompt button for the widget."""
    title: str
    link: str | None = None
    prompt: str | None = None


class FollowUpPrompt(BaseModel):
    """A follow-up prompt the AI can suggest after responses."""
    title: str
    description: str | None = None  # Admin context for the LLM (not shown to end users)
    link: str | None = None
    prompt: str | None = None


class GreetingPrompt(BaseModel):
    """A greeting prompt bubble shown before the chat is opened."""
    title: str
    prompt: str


class ChatbotResponse(BaseModel):
    """Schema for chatbot list/detail responses."""
    id: int
    public_id: str
    organization_id: int | None = None
    name: str
    description: str | None = None
    instructions: str | None = None
    website_url: str | None = None
    status: str
    is_active: bool = True
    created_at: datetime
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None
    follow_up_prompts: list[FollowUpPrompt] | None = None
    greeting_prompts: list[GreetingPrompt] | None = None
    greeting_prompt_duration: int | None = None
    widget_logo_url: str | None = None
    widget_width: int | None = None
    widget_height: int | None = None
    widget_header_color: str | None = None
    widget_user_bubble_color: str | None = None
    widget_assistant_bubble_color: str | None = None
    widget_font_family: str | None = None
    widget_font_size: int | None = None
    widget_text_color: str | None = None
    voice_enabled: bool = False
    mcp_servers: list[MCPServer] | None = None
    webmcp_enabled: bool = False
    person_mode_enabled: bool = True
    navigation_enabled: bool = False
    auto_recrawl_enabled: bool = True
    recrawl_interval_hours: int = 48
    last_crawled_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ChatbotDetailResponse(ChatbotResponse):
    """Extended chatbot response that includes crawl job history."""
    crawl_jobs: list[CrawlJobResponse] = []
    documents: list[DocumentResponse] = []
    agent_texts: list[AgentTextResponse] = []


class WidgetSettingsUpdate(BaseModel):
    """Schema for updating widget customization settings."""
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None
    follow_up_prompts: list[FollowUpPrompt] | None = None
    greeting_prompts: list[GreetingPrompt] | None = None
    greeting_prompt_duration: int | None = None
    widget_logo_url: str | None = None
    widget_width: int | None = None
    widget_height: int | None = None
    widget_header_color: str | None = None
    widget_user_bubble_color: str | None = None
    widget_assistant_bubble_color: str | None = None
    widget_font_family: str | None = None
    widget_font_size: int | None = None
    widget_text_color: str | None = None
    voice_enabled: bool = False
    mcp_servers: list[MCPServer] | None = None
    webmcp_enabled: bool = False
    person_mode_enabled: bool = True
    navigation_enabled: bool = False


class WidgetSettingsResponse(BaseModel):
    """Schema for widget settings responses."""
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None
    follow_up_prompts: list[FollowUpPrompt] | None = None
    greeting_prompts: list[GreetingPrompt] | None = None
    greeting_prompt_duration: int | None = None
    widget_logo_url: str | None = None
    widget_width: int | None = None
    widget_height: int | None = None
    widget_header_color: str | None = None
    widget_user_bubble_color: str | None = None
    widget_assistant_bubble_color: str | None = None
    widget_font_family: str | None = None
    widget_font_size: int | None = None
    widget_text_color: str | None = None
    voice_enabled: bool = False
    mcp_servers: list[MCPServer] | None = None
    webmcp_enabled: bool = False
    person_mode_enabled: bool = True
    navigation_enabled: bool = False

    model_config = ConfigDict(from_attributes=True)


class ChatbotMetrics(BaseModel):
    """Analytics metrics for a chatbot or organization."""
    total_conversations: int
    total_messages: int
    resolved_requests: int


class ChatbotMetricsMap(BaseModel):
    """Per-chatbot metrics keyed by chatbot ID."""
    metrics: dict[int, ChatbotMetrics]


class DailyDataPoint(BaseModel):
    """A single day's count for time-series analytics."""
    date: str
    count: int


class OrgAnalytics(BaseModel):
    """Daily time-series analytics for an organization."""
    messages_per_day: list[DailyDataPoint]
    conversations_per_day: list[DailyDataPoint]
    resolved_per_day: list[DailyDataPoint]
    unique_visitors_per_day: list[DailyDataPoint]


class ChatbotMiniAnalytics(BaseModel):
    """Compact daily analytics for a single chatbot."""
    messages: list[DailyDataPoint]
    conversations: list[DailyDataPoint]
    resolved: list[DailyDataPoint]


class PublicWidgetConfig(BaseModel):
    """Public config returned to the embeddable widget. No sensitive data."""
    chatbot_id: str
    name: str
    is_active: bool = True
    widget_icon: str | None = None
    widget_welcome: str | None = None
    widget_position: str | None = None
    quick_prompts: list[QuickPrompt] | None = None
    follow_up_prompts: list[FollowUpPrompt] | None = None
    greeting_prompts: list[GreetingPrompt] | None = None
    greeting_prompt_duration: int | None = None
    widget_logo_url: str | None = None
    widget_width: int | None = None
    widget_height: int | None = None
    widget_header_color: str | None = None
    widget_user_bubble_color: str | None = None
    widget_assistant_bubble_color: str | None = None
    widget_font_family: str | None = None
    widget_font_size: int | None = None
    widget_text_color: str | None = None
    voice_enabled: bool = False
    webmcp_enabled: bool = False
    person_mode_enabled: bool = True
    navigation_enabled: bool = False
