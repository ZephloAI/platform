"""
Internal router - endpoints called by the agent service.

These are NOT authenticated (internal network only). The agent service
uses them to store messages and fetch conversation history.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_session import ChatSession
from app.models.message import Message
from app.schemas.chat import InternalMessageRequest, MessageResponse
from app.routers.ws_admin import notify_admin_ws

router = APIRouter(prefix="/api/internal", tags=["internal"])


@router.post("/messages", response_model=MessageResponse)
async def store_message(
    body: InternalMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Agent stores a user or assistant message.

    Also updates the session's updated_at timestamp and pushes
    user messages to connected admin WebSockets.
    """
    # Verify session exists
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == body.session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update session timestamp
    session.updated_at = datetime.now(timezone.utc)

    # Store the message
    message = Message(
        session_id=body.session_id,
        role=body.role,
        content=body.content,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Push user messages to admin WebSockets so the dashboard updates in real time
    if body.role == "user":
        await notify_admin_ws(body.session_id, {
            "message_type": "new_message",
            "message": {
                "id": message.id,
                "session_id": str(message.session_id),
                "role": message.role,
                "content": message.content,
                "created_at": message.created_at.isoformat(),
            },
        })

    return MessageResponse(
        id=message.id,
        session_id=str(message.session_id),
        role=message.role,
        content=message.content,
        created_at=message.created_at,
    )


@router.get("/messages/{session_id}", response_model=list[MessageResponse])
async def get_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Agent fetches message history for context."""
    result = await db.execute(
        select(Message)
        .where(Message.session_id == session_id)
        .order_by(Message.created_at)
    )
    messages = result.scalars().all()

    return [
        MessageResponse(
            id=msg.id,
            session_id=str(msg.session_id),
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at,
        )
        for msg in messages
    ]


@router.put("/conversations/{session_id}/unread")
async def mark_unread(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Agent marks a session as unread when a visitor sends a message
    in person mode, so the admin dashboard shows it as new.
    """
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_unread = True
    await db.commit()

    return {"ok": True}
