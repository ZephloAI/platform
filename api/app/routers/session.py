"""Session router - creates chat sessions for widget/dashboard connections."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_session import ChatSession
from app.repositories.chatbot_repository import ChatbotRepository

router = APIRouter(tags=["sessions"])


class CreateSessionRequest(BaseModel):
    chatbot_id: int


@router.post("/api/session")
async def create_session(
    body: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new chat session for a chatbot.

    No authentication required - used by the public widget and dashboard preview.
    Verifies the chatbot exists, then creates a session record and returns its UUID.
    """
    chatbot = await ChatbotRepository(db).get_by_id(body.chatbot_id)
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found",
        )

    session = ChatSession(chatbot_id=chatbot.id)
    db.add(session)
    await db.flush()
    session_id = str(session.id)
    await db.commit()
    return {"session_id": session_id}
