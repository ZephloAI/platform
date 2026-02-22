"""
Public chat router - widget configuration endpoint.

The embeddable widget fetches its config (name, icon, welcome message, etc.)
from the GET endpoint here.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.chatbot import PublicWidgetConfig
from app.repositories.chatbot_repository import ChatbotRepository

router = APIRouter(prefix="/api/public", tags=["public-chat"])


@router.get("/chatbots/{chatbot_id}/config", response_model=PublicWidgetConfig)
async def get_widget_config(
    chatbot_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint returning widget configuration.

    No authentication required. The embeddable widget calls this on init
    to get the chatbot name, icon, welcome message, and position.
    """
    chatbot_repo = ChatbotRepository(db)
    chatbot = await chatbot_repo.get_by_id(chatbot_id)

    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found",
        )

    return PublicWidgetConfig(
        chatbot_id=chatbot.id,
        name=chatbot.name,
        widget_icon=chatbot.widget_icon,
        widget_welcome=chatbot.widget_welcome,
        widget_position=chatbot.widget_position,
        quick_prompts=chatbot.quick_prompts or [],
        follow_up_prompts=chatbot.follow_up_prompts or [],
        greeting_prompts=chatbot.greeting_prompts or [],
        greeting_prompt_duration=chatbot.greeting_prompt_duration,
        widget_logo_url=chatbot.widget_logo_url,
        widget_width=chatbot.widget_width,
        widget_height=chatbot.widget_height,
        widget_header_color=chatbot.widget_header_color,
        widget_user_bubble_color=chatbot.widget_user_bubble_color,
        widget_assistant_bubble_color=chatbot.widget_assistant_bubble_color,
        widget_font_family=chatbot.widget_font_family,
        widget_font_size=chatbot.widget_font_size,
        widget_text_color=chatbot.widget_text_color,
    )
