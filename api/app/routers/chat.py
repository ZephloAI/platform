"""
Chat router - proxy endpoint for the AI agent service.

Takes a user's chat message and forwards it to the agent service,
which performs RAG (retrieval-augmented generation) to answer
questions about the chatbot's website content.

Flow:
  User sends ChatRequest
  -> Router verifies chatbot ownership
  -> Proxies request to agent service via httpx
  -> Returns agent's ChatResponse to user
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Send a chat message to a chatbot.

    1. Verifies the user owns the chatbot
    2. Forwards the message to the agent service
    3. Returns the AI-generated response with source references

    Raises 404 if chatbot not found or not owned by user.
    Raises 502 if the agent service is unreachable.
    """
    # Verify the user owns this chatbot
    chatbot_service = ChatbotService(db)
    chatbot = await chatbot_service.get_chatbot(body.chatbot_id, user.id)

    # Proxy the request to the agent service (include chatbot_name for collection lookup)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AGENT_SERVICE_URL}/api/chat",
                json={
                    "chatbot_id": body.chatbot_id,
                    "chatbot_name": chatbot.name,
                    "message": body.message,
                },
                timeout=30.0,  # Agent may take time for RAG
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
