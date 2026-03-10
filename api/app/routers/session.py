"""
Session router - creates chat sessions for widget/dashboard connections.

Supports optional X-API-Key header for authenticated access.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import validate_api_key
from app.models.chat_session import ChatSession
from app.repositories.chatbot_repository import ChatbotRepository

router = APIRouter(tags=["sessions"])


class CreateSessionRequest(BaseModel):
    chatbot_id: int


@router.post("/api/session")
async def create_session(
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
    api_key=Depends(validate_api_key),
):
    """
    Create a new chat session for a chatbot.

    Accepts an optional X-API-Key header. If provided, the key must be
    valid and belong to the requested chatbot. If absent, access is allowed
    without authentication (backward compatible).
    """
    # If an API key was provided, verify it belongs to this chatbot
    if api_key and api_key.chatbot_id != body.chatbot_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key does not match this chatbot",
        )

    chatbot = await ChatbotRepository(db).get_by_id(body.chatbot_id)
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found",
        )

    if not chatbot.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chatbot is currently inactive",
        )

    session = ChatSession(chatbot_id=chatbot.id)
    db.add(session)
    await db.flush()
    session_id = str(session.id)
    await db.commit()
    return {"session_id": session_id}
