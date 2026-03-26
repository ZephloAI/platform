"""
Chatbots router - CRUD endpoints for chatbot management.

All endpoints require authentication (get_current_user dependency).

Flow:
  Router receives request + authenticated user
  -> ChatbotService handles business logic + ownership checks
  -> ChatbotRepository accesses the database
  -> Response returned to client
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, func, cast, Date
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
    ChatbotMetricsMap,
    ChatbotMiniAnalytics,
    DailyDataPoint,
    OrgAnalytics,
    WidgetSettingsUpdate,
    WidgetSettingsResponse,
)
from app.repositories.chatbot_repository import ChatbotRepository
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/api/agents", tags=["agents"])


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


@router.put("/{agent_id}", response_model=ChatbotResponse)
async def update_chatbot(
    agent_id: str,
    body: ChatbotUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update chatbot general settings (name, description, instructions)."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = ChatbotService(db)
    return await service.update_chatbot(chatbot.id, user.id, body)


@router.get("/{agent_id}", response_model=ChatbotDetailResponse)
async def get_chatbot(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single chatbot with its crawl job history.

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    """
    chatbot = await _resolve_chatbot(db, agent_id)
    service = ChatbotService(db)
    return await service.get_chatbot(chatbot.id, user.id)


@router.get("/{agent_id}/widget-settings", response_model=WidgetSettingsResponse)
async def get_widget_settings(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get widget customization settings for a chatbot."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = ChatbotService(db)
    return await service.get_chatbot(chatbot.id, user.id)


@router.put("/{agent_id}/widget-settings", response_model=WidgetSettingsResponse)
async def update_widget_settings(
    agent_id: str,
    body: WidgetSettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update widget customization settings for a chatbot."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = ChatbotService(db)
    return await service.update_widget_settings(chatbot.id, user.id, body)


@router.post("/{agent_id}/logo")
async def upload_logo(
    agent_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a logo image for the chatbot widget."""
    chatbot = await _resolve_chatbot(db, agent_id)

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
    await service.get_chatbot(chatbot.id, user.id)

    # Upload to S3
    from app.services.s3_storage import upload_logo as do_upload
    url = await do_upload(file, chatbot.id)

    # Update chatbot record
    repo = ChatbotRepository(db)
    await repo.update(chatbot.id, widget_logo_url=url)

    return {"url": url}


@router.get("/{agent_id}/metrics", response_model=ChatbotMetrics)
async def get_chatbot_metrics(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get resolution metrics for a single chatbot."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = ChatbotService(db)
    await service.get_chatbot(chatbot.id, user.id)

    return await _compute_metrics(db, chatbot_id=chatbot.id)


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


async def _compute_metrics_batch(
    db: SASession,
    *,
    chatbot_ids: list[int],
) -> dict[int, ChatbotMetrics]:
    """Compute metrics per chatbot in batch (3 queries total, not N)."""
    # Conversations per chatbot
    conv_q = (
        select(ChatSession.chatbot_id, func.count(ChatSession.id))
        .where(ChatSession.chatbot_id.in_(chatbot_ids))
        .group_by(ChatSession.chatbot_id)
    )
    conv_map = {row[0]: row[1] for row in (await db.execute(conv_q)).all()}

    # Messages per chatbot
    msg_q = (
        select(ChatSession.chatbot_id, func.count(Message.id))
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(ChatSession.chatbot_id.in_(chatbot_ids))
        .group_by(ChatSession.chatbot_id)
    )
    msg_map = {row[0]: row[1] for row in (await db.execute(msg_q)).all()}

    # Resolved per chatbot
    res_q = (
        select(ChatSession.chatbot_id, func.count(Message.id))
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(
            ChatSession.chatbot_id.in_(chatbot_ids),
            Message.role == "assistant",
            Message.is_resolved == True,
        )
        .group_by(ChatSession.chatbot_id)
    )
    res_map = {row[0]: row[1] for row in (await db.execute(res_q)).all()}

    return {
        cid: ChatbotMetrics(
            total_conversations=conv_map.get(cid, 0),
            total_messages=msg_map.get(cid, 0),
            resolved_requests=res_map.get(cid, 0),
        )
        for cid in chatbot_ids
    }


async def _compute_analytics_batch(
    db: SASession,
    *,
    chatbot_ids: list[int],
    days: int = 14,
) -> dict[int, ChatbotMiniAnalytics]:
    """Compute per-chatbot daily analytics in batch (3 queries, not N)."""
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    all_dates = [(start_date + timedelta(days=i)).isoformat() for i in range(days)]

    # Messages per chatbot per day
    msg_q = (
        select(
            ChatSession.chatbot_id,
            cast(Message.created_at, Date).label("day"),
            func.count(Message.id).label("cnt"),
        )
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(
            ChatSession.chatbot_id.in_(chatbot_ids),
            cast(Message.created_at, Date) >= start_date,
        )
        .group_by(ChatSession.chatbot_id, "day")
    )
    msg_rows: dict[int, dict[str, int]] = {}
    for r in (await db.execute(msg_q)).all():
        msg_rows.setdefault(r[0], {})[str(r.day)] = r.cnt

    # Conversations per chatbot per day
    conv_q = (
        select(
            ChatSession.chatbot_id,
            cast(ChatSession.created_at, Date).label("day"),
            func.count(ChatSession.id).label("cnt"),
        )
        .where(
            ChatSession.chatbot_id.in_(chatbot_ids),
            cast(ChatSession.created_at, Date) >= start_date,
        )
        .group_by(ChatSession.chatbot_id, "day")
    )
    conv_rows: dict[int, dict[str, int]] = {}
    for r in (await db.execute(conv_q)).all():
        conv_rows.setdefault(r[0], {})[str(r.day)] = r.cnt

    # Resolved per chatbot per day
    res_q = (
        select(
            ChatSession.chatbot_id,
            cast(Message.created_at, Date).label("day"),
            func.count(Message.id).label("cnt"),
        )
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(
            ChatSession.chatbot_id.in_(chatbot_ids),
            Message.role == "assistant",
            Message.is_resolved == True,
            cast(Message.created_at, Date) >= start_date,
        )
        .group_by(ChatSession.chatbot_id, "day")
    )
    res_rows: dict[int, dict[str, int]] = {}
    for r in (await db.execute(res_q)).all():
        res_rows.setdefault(r[0], {})[str(r.day)] = r.cnt

    def fill(rows: dict[str, int]) -> list[DailyDataPoint]:
        return [DailyDataPoint(date=d, count=rows.get(d, 0)) for d in all_dates]

    return {
        cid: ChatbotMiniAnalytics(
            messages=fill(msg_rows.get(cid, {})),
            conversations=fill(conv_rows.get(cid, {})),
            resolved=fill(res_rows.get(cid, {})),
        )
        for cid in chatbot_ids
    }


async def _compute_analytics(
    db: SASession,
    *,
    chatbot_ids: list[int],
    days: int = 30,
) -> OrgAnalytics:
    """Compute daily time-series analytics for a set of chatbots."""
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    # Build all dates in range for gap-filling
    all_dates = [(start_date + timedelta(days=i)).isoformat() for i in range(days)]

    session_filter = [ChatSession.chatbot_id.in_(chatbot_ids)]
    date_filter = cast(ChatSession.created_at, Date) >= start_date

    # Messages per day
    msg_q = (
        select(
            cast(Message.created_at, Date).label("day"),
            func.count(Message.id).label("cnt"),
        )
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(*session_filter, cast(Message.created_at, Date) >= start_date)
        .group_by("day")
    )
    msg_rows = {str(r.day): r.cnt for r in (await db.execute(msg_q)).all()}

    # Conversations per day
    conv_q = (
        select(
            cast(ChatSession.created_at, Date).label("day"),
            func.count(ChatSession.id).label("cnt"),
        )
        .where(*session_filter, date_filter)
        .group_by("day")
    )
    conv_rows = {str(r.day): r.cnt for r in (await db.execute(conv_q)).all()}

    # Resolved per day
    resolved_q = (
        select(
            cast(Message.created_at, Date).label("day"),
            func.count(Message.id).label("cnt"),
        )
        .join(ChatSession, Message.session_id == ChatSession.id)
        .where(
            *session_filter,
            Message.role == "assistant",
            Message.is_resolved == True,
            cast(Message.created_at, Date) >= start_date,
        )
        .group_by("day")
    )
    resolved_rows = {str(r.day): r.cnt for r in (await db.execute(resolved_q)).all()}

    # Unique visitors per day (distinct sessions)
    visitors_q = (
        select(
            cast(ChatSession.created_at, Date).label("day"),
            func.count(func.distinct(ChatSession.id)).label("cnt"),
        )
        .where(*session_filter, date_filter)
        .group_by("day")
    )
    visitors_rows = {str(r.day): r.cnt for r in (await db.execute(visitors_q)).all()}

    def fill(rows: dict[str, int]) -> list[DailyDataPoint]:
        return [DailyDataPoint(date=d, count=rows.get(d, 0)) for d in all_dates]

    return OrgAnalytics(
        messages_per_day=fill(msg_rows),
        conversations_per_day=fill(conv_rows),
        resolved_per_day=fill(resolved_rows),
        unique_visitors_per_day=fill(visitors_rows),
    )


@router.delete("/{agent_id}")
async def delete_chatbot(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a chatbot and all its associated data (crawl jobs, pages).

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    """
    chatbot = await _resolve_chatbot(db, agent_id)
    service = ChatbotService(db)
    await service.delete_chatbot(chatbot.id, user.id)
    return {"ok": True}
