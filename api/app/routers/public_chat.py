"""
Public chat router - unauthenticated endpoint for the embeddable widget.

End-users on websites that embed the chat widget use this endpoint.
No authentication required - the chatbot is identified by its ID.

Flow:
  Visitor sends PublicChatRequest (chatbot_id + message)
  -> Router verifies chatbot exists and is ready
  -> Proxies request to agent service via httpx
  -> Returns agent's ChatResponse to visitor
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas.chat import ChatResponse
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
    )


class PublicChatRequest(BaseModel):
    """Schema for public chat messages from the embeddable widget."""
    chatbot_id: int
    message: str
    session_id: str | None = None


@router.post("/chat", response_model=ChatResponse)
async def public_chat(
    body: PublicChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Public chat endpoint for the embeddable widget.

    No authentication required. Verifies the chatbot exists and is ready
    before forwarding the message to the agent service.

    Raises 404 if chatbot not found.
    Raises 400 if chatbot is not ready (hasn't been crawled yet).
    Raises 502 if the agent service is unreachable.
    """
    # Verify the chatbot exists and is ready
    chatbot_repo = ChatbotRepository(db)
    chatbot = await chatbot_repo.get_by_id(body.chatbot_id)

    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found",
        )

    if chatbot.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chatbot is not ready yet. Please wait for crawling to complete.",
        )

    # Proxy the request to the agent service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AGENT_SERVICE_URL}/api/chat",
                json={
                    "chatbot_id": body.chatbot_id,
                    "chatbot_name": chatbot.name,
                    "message": body.message,
                    "session_id": body.session_id,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Agent service is unavailable",
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail="Agent service returned an error",
        )
