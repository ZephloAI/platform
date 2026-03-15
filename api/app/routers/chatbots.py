"""
Chatbots router - CRUD endpoints for chatbot management.

All endpoints require authentication (get_current_user dependency).

Flow:
  Router receives request + authenticated user
  -> ChatbotService handles business logic + ownership checks
  -> ChatbotRepository accesses the database
  -> Response returned to client
"""

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession as SASession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat_session import ChatSession
from app.models.message import Message
from app.models.user import User
from app.schemas.chatbot import (
    ChatbotCreate,
    ChatbotUpdate,
    ChatbotResponse,
    ChatbotDetailResponse,
    ChatbotMetrics,
    WidgetSettingsUpdate,
    WidgetSettingsResponse,
)
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/api/chatbots", tags=["chatbots"])


@router.get("", response_model=list[ChatbotResponse])
async def list_chatbots(
    organization_id: int | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List chatbots. If organization_id is provided, returns chatbots
    for that org (requires membership). Otherwise returns user's chatbots.
    """
    if organization_id:
        from app.services.organization_service import OrganizationService
        org_service = OrganizationService(db)
        await org_service.verify_membership(organization_id, user.id)

    service = ChatbotService(db)
    return await service.list_chatbots(user.id, organization_id=organization_id)


@router.post("", response_model=ChatbotResponse, status_code=201)
async def create_chatbot(
    body: ChatbotCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new chatbot.

    The chatbot starts with status "pending" until a crawl is triggered.
    Accepts optional organization_id in body.
    """
    if body.organization_id:
        from app.services.organization_service import OrganizationService
        org_service = OrganizationService(db)
        await org_service.verify_membership(body.organization_id, user.id)

    service = ChatbotService(db)
    return await service.create_chatbot(
        user_id=user.id,
        name=body.name,
        description=body.description,
        instructions=body.instructions,
        organization_id=body.organization_id,
    )


@router.put("/{chatbot_id}", response_model=ChatbotResponse)
async def update_chatbot(
    chatbot_id: int,
    body: ChatbotUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update chatbot general settings (name, description, instructions)."""
    service = ChatbotService(db)
    return await service.update_chatbot(chatbot_id, user.id, body)


@router.get("/{chatbot_id}", response_model=ChatbotDetailResponse)
async def get_chatbot(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single chatbot with its crawl job history.

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    """
    service = ChatbotService(db)
    return await service.get_chatbot(chatbot_id, user.id)


@router.get("/{chatbot_id}/widget-settings", response_model=WidgetSettingsResponse)
async def get_widget_settings(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get widget customization settings for a chatbot."""
    service = ChatbotService(db)
    return await service.get_chatbot(chatbot_id, user.id)


@router.put("/{chatbot_id}/widget-settings", response_model=WidgetSettingsResponse)
async def update_widget_settings(
    chatbot_id: int,
    body: WidgetSettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update widget customization settings for a chatbot."""
    service = ChatbotService(db)
    return await service.update_widget_settings(chatbot_id, user.id, body)


@router.post("/{chatbot_id}/logo")
async def upload_logo(
    chatbot_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a logo image for the chatbot widget."""
    # Validate file type
    allowed_types = {"image/png", "image/jpeg", "image/svg+xml", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be PNG, JPG, SVG, or WebP",
        )

    # Validate file size (2MB)
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be smaller than 2MB",
        )
    await file.seek(0)

    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot_id, user.id)

    # Upload to S3
    from app.services.s3_storage import upload_logo as do_upload
    url = await do_upload(file, chatbot_id)

    # Update chatbot record
    from app.repositories.chatbot_repository import ChatbotRepository
    repo = ChatbotRepository(db)
    await repo.update(chatbot_id, widget_logo_url=url)

    return {"url": url}


@router.get("/{chatbot_id}/metrics", response_model=ChatbotMetrics)
async def get_chatbot_metrics(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get resolution metrics for a single chatbot."""
    service = ChatbotService(db)
    await service.get_chatbot(chatbot_id, user.id)

    return await _compute_metrics(db, chatbot_id=chatbot_id)


async def _compute_metrics(
    db: SASession,
    *,
    chatbot_id: int | None = None,
    chatbot_ids: list[int] | None = None,
) -> ChatbotMetrics:
    """Compute resolution metrics for one or many chatbots."""
    # Build session filter
    session_filter = []
    if chatbot_id is not None:
        session_filter.append(ChatSession.chatbot_id == chatbot_id)
    elif chatbot_ids is not None:
        session_filter.append(ChatSession.chatbot_id.in_(chatbot_ids))

    # Total conversations
    total_q = select(func.count(ChatSession.id)).where(*session_filter)
    total_conversations = (await db.execute(total_q)).scalar() or 0

    # Total messages across those sessions
    msg_q = (
        select(func.count(Message.id))
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(*session_filter)
    )
    total_messages = (await db.execute(msg_q)).scalar() or 0

    # Resolved requests: every assistant message with is_resolved=True
    resolved_q = (
        select(func.count(Message.id))
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(Message.role == "assistant", Message.is_resolved == True, *session_filter)
    )
    resolved_requests = (await db.execute(resolved_q)).scalar() or 0

    return ChatbotMetrics(
        total_conversations=total_conversations,
        total_messages=total_messages,
        resolved_requests=resolved_requests,
    )


@router.delete("/{chatbot_id}")
async def delete_chatbot(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a chatbot and all its associated data (crawl jobs, pages).

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    """
    service = ChatbotService(db)
    await service.delete_chatbot(chatbot_id, user.id)
    return {"ok": True}
