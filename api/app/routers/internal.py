"""
Internal router - endpoints called by the agent service.

These are NOT authenticated (internal network only). The agent service
uses them to store messages and fetch conversation history.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.agent_token_usage import AgentTokenUsage
from app.models.chat_session import ChatSession
from app.models.chatbot import Chatbot
from app.models.message import Message
from app.schemas.chat import InternalMessageRequest, MessageResponse
from app.schemas.lead import LeadCreate, LeadResponse
from app.services.lead_service import LeadService
from app.routers.ws_admin import notify_admin_ws
from app.services.usage_service import (
    ERR_ORG_SUSPENDED,
    ERR_MAX_TOKENS,
    UsageService,
)

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
        is_resolved=body.is_resolved,
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
        is_resolved=message.is_resolved,
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
            is_resolved=msg.is_resolved,
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


# ---------------------------------------------------------------------
# Lead capture (called by the agent service when lead_capture_enabled)
# ---------------------------------------------------------------------


@router.post("/leads", response_model=LeadResponse)
async def upsert_lead(
    body: LeadCreate,
    db: AsyncSession = Depends(get_db),
):
    """Agent saves visitor details. Merges into the session's existing row
    if one already exists; empty fields are ignored.
    """
    lead = await LeadService(db).upsert_from_agent(body)
    return LeadResponse.model_validate(lead)


# ---------------------------------------------------------------------
# Usage precheck + recording (called by the agent service)
# ---------------------------------------------------------------------


class UsagePrecheckRequest(BaseModel):
    chatbot_id: int


class UsagePrecheckResponse(BaseModel):
    ok: bool
    organization_id: int | None = None
    code: str | None = None
    message: str | None = None
    limit: int | None = None


class UsageRecordRequest(BaseModel):
    chatbot_id: int
    session_id: str | None = None
    model: str | None = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


async def _chatbot_org_id(db: AsyncSession, chatbot_id: int) -> int | None:
    result = await db.execute(
        select(Chatbot.organization_id).where(Chatbot.id == chatbot_id)
    )
    return result.scalar_one_or_none()


@router.post("/usage/precheck", response_model=UsagePrecheckResponse)
async def usage_precheck(
    body: UsagePrecheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """Agent calls this before running the LLM. Returns ok=false with a
    structured code when the organization is over its token budget or
    suspended so the agent can surface the error cleanly."""
    org_id = await _chatbot_org_id(db, body.chatbot_id)
    if org_id is None:
        # Agent exists but isn't bound to an org — no limits to enforce.
        return UsagePrecheckResponse(ok=True)

    service = UsageService(db)
    try:
        await service.enforce_token_budget(org_id)
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        return UsagePrecheckResponse(
            ok=False,
            organization_id=org_id,
            code=detail.get("code"),
            message=detail.get("message"),
            limit=detail.get("limit"),
        )
    return UsagePrecheckResponse(ok=True, organization_id=org_id)


@router.post("/usage/record")
async def usage_record(
    body: UsageRecordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Agent records token usage after an LLM run. Inserts a row into
    agent_token_usage and bumps the cheap per-org counter."""
    org_id = await _chatbot_org_id(db, body.chatbot_id)
    if org_id is None:
        # No organization to attribute usage to — quietly drop.
        return {"ok": True}

    db.add(
        AgentTokenUsage(
            organization_id=org_id,
            chatbot_id=body.chatbot_id,
            session_id=body.session_id,
            model=body.model,
            prompt_tokens=body.prompt_tokens,
            completion_tokens=body.completion_tokens,
            total_tokens=body.total_tokens,
        )
    )
    await db.commit()

    if body.total_tokens:
        await UsageService(db).record_tokens(org_id, body.total_tokens)
    return {"ok": True}
