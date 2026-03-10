"""
Public chat router - widget configuration endpoint.

The embeddable widget fetches its config (name, icon, welcome message, etc.)
from the GET endpoint here.

Supports optional X-API-Key header for authenticated access.
If a key is provided, it must be valid and match the chatbot_id.
If no key is provided, the endpoint works without auth (backward compat).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import validate_api_key
from app.schemas.chatbot import PublicWidgetConfig
from app.repositories.chatbot_repository import ChatbotRepository

router = APIRouter(prefix="/api/public", tags=["public-chat"])


@router.get("/chatbots/{chatbot_id}/config", response_model=PublicWidgetConfig)
async def get_widget_config(
    chatbot_id: int,
    db: AsyncSession = Depends(get_db),
    api_key=Depends(validate_api_key),
):
    """
    Public endpoint returning widget configuration.

    Accepts an optional X-API-Key header. If provided, the key must be
    valid and belong to the requested chatbot. If absent, access is allowed
    without authentication (backward compatible).
    """
    # If an API key was provided, verify it belongs to this chatbot
    if api_key and api_key.chatbot_id != chatbot_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key does not match this chatbot",
        )

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
        is_active=chatbot.is_active if chatbot.is_active is not None else True,
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
        voice_enabled=chatbot.voice_enabled or False,
        webmcp_enabled=chatbot.webmcp_enabled or False,
    )
