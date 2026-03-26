"""
Conversations router - admin endpoints for viewing and managing chat sessions.

All endpoints require authentication (get_current_user dependency).
"""

import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, desc, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat_session import ChatSession
from app.models.message import Message
from app.models.user import User
from app.repositories.chatbot_repository import ChatbotRepository
from app.schemas.chat import (
    AdminMessageRequest,
    MessageResponse,
    SessionDetailResponse,
    SessionListItem,
    SwitchModeRequest,
)
from app.routers.ws_admin import notify_admin_message

logger = logging.getLogger(__name__)

router = APIRouter(tags=["conversations"])


async def _resolve_chatbot(db: AsyncSession, agent_id: str):
    """Resolve a chatbot by its public_id. Raises 404 if not found."""
    repo = ChatbotRepository(db)
    chatbot = await repo.get_by_public_id(agent_id)
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return chatbot


@router.get(
    "/api/agents/{agent_id}/conversations",
    response_model=list[SessionListItem],
)
async def list_conversations(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List chat sessions for a chatbot.

    Returns sessions with last message info, ordered with person-mode
    sessions first, then by updated_at descending.
    """
    chatbot = await _resolve_chatbot(db, agent_id)

    # Subquery: last message content and timestamp per session
    last_msg_sub = (
        select(
            Message.session_id,
            func.max(Message.created_at).label("last_message_at"),
        )
        .group_by(Message.session_id)
        .subquery()
    )

    # Subquery: message count per session
    count_sub = (
        select(
            Message.session_id,
            func.count(Message.id).label("message_count"),
        )
        .group_by(Message.session_id)
        .subquery()
    )

    # Main query
    query = (
        select(
            ChatSession,
            last_msg_sub.c.last_message_at,
            count_sub.c.message_count,
        )
        .outerjoin(last_msg_sub, ChatSession.id == last_msg_sub.c.session_id)
        .outerjoin(count_sub, ChatSession.id == count_sub.c.session_id)
        .where(ChatSession.chatbot_id == chatbot.id)
        .order_by(
            # Person-mode sessions first
            case((ChatSession.mode == "person", 0), else_=1),
            desc(ChatSession.updated_at),
        )
    )

    result = await db.execute(query)
    rows = result.all()

    # For each row, fetch the last message content
    items: list[SessionListItem] = []
    for session, last_message_at, message_count in rows:
        last_message = None
        if last_message_at:
            msg_result = await db.execute(
                select(Message.content)
                .where(
                    Message.session_id == session.id,
                    Message.created_at == last_message_at,
                )
                .limit(1)
            )
            last_message = msg_result.scalar_one_or_none()

        items.append(
            SessionListItem(
                id=str(session.id),
                chatbot_id=session.chatbot_id,
                mode=session.mode,
                is_unread=session.is_unread,
                created_at=session.created_at,
                updated_at=session.updated_at,
                last_message=last_message,
                last_message_at=last_message_at,
                message_count=message_count or 0,
            )
        )

    return items


@router.get(
    "/api/conversations/{session_id}",
    response_model=SessionDetailResponse,
)
async def get_conversation(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full message history for a chat session."""
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionDetailResponse(
        id=str(session.id),
        chatbot_id=session.chatbot_id,
        mode=session.mode,
        is_unread=session.is_unread,
        admin_id=session.admin_id,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[
            MessageResponse(
                id=msg.id,
                session_id=str(msg.session_id),
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at,
            )
            for msg in session.messages
        ],
    )


@router.post(
    "/api/conversations/{session_id}/messages",
    response_model=MessageResponse,
)
async def send_admin_message(
    session_id: str,
    body: AdminMessageRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin sends a message in a conversation."""
    # Verify session exists
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Switch to person mode if not already
    if session.mode != "person":
        session.mode = "person"

    session.updated_at = datetime.now(timezone.utc)

    # Store the message
    message = Message(
        session_id=session_id,
        role="admin",
        content=body.content,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    # Broadcast to connected admin WebSockets
    await notify_admin_message(session_id, {
        "id": message.id,
        "session_id": str(message.session_id),
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat(),
    })

    # Push admin message to visitor's widget via agent service
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            push_resp = await http_client.post(
                f"{settings.AGENT_SERVICE_URL}/api/internal/push",
                json={"session_id": session_id, "content": body.content},
            )
            logger.info(f"Push to agent: status={push_resp.status_code}, body={push_resp.text}")
    except Exception as e:
        logger.warning(f"Failed to push admin message to agent: {e}")

    return MessageResponse(
        id=message.id,
        session_id=str(message.session_id),
        role=message.role,
        content=message.content,
        created_at=message.created_at,
    )


@router.put("/api/conversations/{session_id}/mode")
async def switch_mode(
    session_id: str,
    body: SwitchModeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Switch a session between AI and person mode."""
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.mode = body.mode
    session.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {"ok": True, "mode": session.mode}


@router.put("/api/conversations/{session_id}/read")
async def mark_read(
    session_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a session as read."""
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_unread = False
    await db.commit()

    return {"ok": True}
