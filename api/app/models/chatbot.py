"""
Chatbot model.

Represents a chatbot tied to a specific website.
Status tracks crawl state. is_active controls whether the widget accepts chat.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, func
from sqlalchemy.orm import relationship

from app.models.base import Base


class Chatbot(Base):
    __tablename__ = "chatbots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    instructions = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, crawling, ready, error
    is_active = Column(Boolean, default=True, server_default="true")
    created_at = Column(DateTime, default=func.now())

    # Widget customization
    widget_icon = Column(String, nullable=True)       # Emoji or image URL
    widget_welcome = Column(String, nullable=True)    # Welcome message
    widget_position = Column(String, nullable=True)   # "right" or "left"
    quick_prompts = Column(JSON, nullable=True, default=[])
    follow_up_prompts = Column(JSON, nullable=True)
    greeting_prompts = Column(JSON, nullable=True, default=[])
    greeting_prompt_duration = Column(Integer, nullable=True)

    # Widget styling
    widget_logo_url = Column(String, nullable=True)
    widget_width = Column(Integer, nullable=True)
    widget_height = Column(Integer, nullable=True)
    widget_header_color = Column(String, nullable=True)
    widget_user_bubble_color = Column(String, nullable=True)
    widget_assistant_bubble_color = Column(String, nullable=True)
    widget_font_family = Column(String, nullable=True)
    widget_font_size = Column(Integer, nullable=True)
    widget_text_color = Column(String, nullable=True)

    # Voice
    voice_enabled = Column(Boolean, default=False, server_default="false")

    # MCP servers
    mcp_servers = Column(JSON, nullable=True, default=[])

    # WebMCP (browser-side tool execution)
    webmcp_enabled = Column(Boolean, default=False, server_default="false")

    # Relationships
    user = relationship("User", back_populates="chatbots")
    crawl_jobs = relationship(
        "CrawlJob", back_populates="chatbot", cascade="all, delete-orphan"
    )
    pages = relationship(
        "Page", back_populates="chatbot", cascade="all, delete-orphan"
    )
