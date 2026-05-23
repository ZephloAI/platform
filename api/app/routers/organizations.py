"""
Organizations router - CRUD endpoints for organization management.

All endpoints require authentication (get_current_user dependency).
"""

import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession as SASession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chatbot import Chatbot
from app.models.chat_session import ChatSession
from app.models.message import Message
from app.models.user import User
from app.repositories.api_key_repository import ApiKeyRepository
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.schemas.chatbot import ChatbotMetrics, ChatbotMetricsMap, ChatbotMiniAnalytics, OrgAnalytics
from app.schemas.chat import RecentConversationItem
from app.schemas.admin import UsageSnapshotResponse
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationMemberResponse,
    InvitationCreate,
    InvitationResponse,
    InvitationPreviewResponse,
    AcceptInvitationRequest,
    UpdateMemberRoleRequest,
)
from app.services.organization_service import OrganizationService
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/organizations", tags=["organizations"])

# Separate router for invitation accept (no /api/organizations prefix)
accept_router = APIRouter(tags=["organizations"])


# -- Organization CRUD --


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all organizations the current user belongs to."""
    service = OrganizationService(db)
    return await service.get_user_organizations(user.id)


@router.post("", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    body: OrganizationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new organization. The current user becomes the creator."""
    service = OrganizationService(db)
    org = await service.create_organization(user.id, body.name)
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "created_at": org.created_at,
        "role": "creator",
    }


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get organization details. Requires membership."""
    service = OrganizationService(db)
    member = await service.verify_membership(org_id, user.id)
    org = await service.get_organization(org_id)
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "created_at": org.created_at,
        "role": member.role,
    }


@router.get("/{org_id}/metrics", response_model=ChatbotMetrics)
async def get_org_metrics(
    org_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated resolution metrics across all chatbots in the organization."""
    service = OrganizationService(db)
    await service.verify_membership(org_id, user.id)

    # Get all chatbot IDs for this org
    result = await db.execute(
        select(Chatbot.id).where(Chatbot.organization_id == org_id)
    )
    chatbot_ids = [row[0] for row in result.all()]

    if not chatbot_ids:
        return ChatbotMetrics(
            total_conversations=0,
            total_messages=0,
            resolved_requests=0,
        )

    from app.routers.chatbots import _compute_metrics
    return await _compute_metrics(db, chatbot_ids=chatbot_ids)


@router.get("/{org_id}/analytics", response_model=OrgAnalytics)
async def get_org_analytics(
    org_id: int,
    days: int = 30,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get daily time-series analytics across all chatbots in the organization."""
    service = OrganizationService(db)
    await service.verify_membership(org_id, user.id)

    result = await db.execute(
        select(Chatbot.id).where(Chatbot.organization_id == org_id)
    )
    chatbot_ids = [row[0] for row in result.all()]

    if not chatbot_ids:
        from app.schemas.chatbot import DailyDataPoint
        from datetime import date, timedelta
        today = date.today()
        empty = [
            DailyDataPoint(date=(today - timedelta(days=days - 1 - i)).isoformat(), count=0)
            for i in range(days)
        ]
        return OrgAnalytics(
            messages_per_day=empty,
            conversations_per_day=empty,
            resolved_per_day=empty,
            unique_visitors_per_day=empty,
        )

    from app.routers.chatbots import _compute_analytics
    return await _compute_analytics(db, chatbot_ids=chatbot_ids, days=days)


@router.get("/{org_id}/chatbot-metrics", response_model=ChatbotMetricsMap)
async def get_org_chatbot_metrics(
    org_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get metrics for every chatbot in the org in a single batch."""
    service = OrganizationService(db)
    await service.verify_membership(org_id, user.id)

    result = await db.execute(
        select(Chatbot.id).where(Chatbot.organization_id == org_id)
    )
    chatbot_ids = [row[0] for row in result.all()]

    if not chatbot_ids:
        return ChatbotMetricsMap(metrics={})

    from app.routers.chatbots import _compute_metrics_batch
    metrics = await _compute_metrics_batch(db, chatbot_ids=chatbot_ids)
    return ChatbotMetricsMap(metrics=metrics)


@router.get("/{org_id}/chatbot-analytics")
async def get_org_chatbot_analytics(
    org_id: int,
    days: int = 14,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get per-chatbot daily analytics for sparklines."""
    service = OrganizationService(db)
    await service.verify_membership(org_id, user.id)

    result = await db.execute(
        select(Chatbot.id).where(Chatbot.organization_id == org_id)
    )
    chatbot_ids = [row[0] for row in result.all()]

    if not chatbot_ids:
        return {}

    from app.routers.chatbots import _compute_analytics_batch
    return await _compute_analytics_batch(db, chatbot_ids=chatbot_ids, days=days)


@router.get(
    "/{org_id}/recent-conversations",
    response_model=list[RecentConversationItem],
)
async def get_org_recent_conversations(
    org_id: int,
    limit: int = 3,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Most recently active chat sessions across all agents in the organization."""
    service = OrganizationService(db)
    await service.verify_membership(org_id, user.id)

    limit = max(1, min(limit, 20))

    # Newest message (content + timestamp) per session via DISTINCT ON,
    # same single-pass approach used by list_conversations.
    last_msg_sub = (
        select(
            Message.session_id.label("session_id"),
            Message.content.label("last_message"),
            Message.created_at.label("last_message_at"),
        )
        .order_by(Message.session_id, desc(Message.created_at))
        .distinct(Message.session_id)
        .subquery()
    )

    # Join sessions to their agent and last message; only sessions that have
    # at least one message, ordered by most recent activity.
    query = (
        select(
            ChatSession,
            Chatbot.public_id,
            Chatbot.name,
            last_msg_sub.c.last_message,
            last_msg_sub.c.last_message_at,
        )
        .join(Chatbot, ChatSession.chatbot_id == Chatbot.id)
        .join(last_msg_sub, ChatSession.id == last_msg_sub.c.session_id)
        .where(Chatbot.organization_id == org_id)
        .order_by(desc(last_msg_sub.c.last_message_at))
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        RecentConversationItem(
            id=str(session.id),
            chatbot_id=session.chatbot_id,
            chatbot_public_id=public_id,
            chatbot_name=name,
            mode=session.mode,
            is_unread=session.is_unread,
            last_message=last_message,
            last_message_at=last_message_at,
            updated_at=session.updated_at,
        )
        for session, public_id, name, last_message, last_message_at in rows
    ]


# -- Members --


@router.get("/{org_id}/usage", response_model=UsageSnapshotResponse)
async def get_org_usage(
    org_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return current usage vs. limits for the customer dashboard."""
    service = OrganizationService(db)
    await service.verify_membership(org_id, user.id)
    snapshot = await UsageService(db).get_snapshot(org_id)
    return UsageSnapshotResponse(
        organization_id=snapshot.organization_id,
        plan=snapshot.plan,
        is_suspended=snapshot.is_suspended,
        users_count=snapshot.users_count,
        pending_invites_count=snapshot.pending_invites_count,
        agents_count=snapshot.agents_count,
        tokens_used_in_period=snapshot.tokens_used_in_period,
        max_users=snapshot.max_users,
        max_agents=snapshot.max_agents,
        max_tokens_per_period=snapshot.max_tokens_per_period,
        seats_remaining=snapshot.seats_remaining,
        token_period=snapshot.token_period,
        token_period_start=snapshot.token_period_start,
    )


@router.get("/{org_id}/members", response_model=list[OrganizationMemberResponse])
async def list_members(
    org_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of the organization. Requires membership."""
    service = OrganizationService(db)
    await service.verify_membership(org_id, user.id)
    return await service.get_members(org_id)


@router.delete("/{org_id}/members/{target_user_id}")
async def remove_member(
    org_id: int,
    target_user_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the organization. Requires admin/owner."""
    service = OrganizationService(db)
    await service.remove_member(org_id, target_user_id, user.id)
    return {"ok": True}


@router.put("/{org_id}/members/{target_user_id}")
async def update_member_role(
    org_id: int,
    target_user_id: int,
    body: UpdateMemberRoleRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a member's role. Requires admin/owner."""
    service = OrganizationService(db)
    await service.update_member_role(org_id, target_user_id, body.role, user.id)
    return {"ok": True}


# -- Invitations --


@router.post("/{org_id}/invitations", response_model=InvitationResponse, status_code=201)
async def invite_user(
    org_id: int,
    body: InvitationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Invite a user to the organization. Requires admin/owner."""
    service = OrganizationService(db)
    return await service.invite_user(org_id, body.email, body.role, user.id)


@router.get("/{org_id}/invitations", response_model=list[InvitationResponse])
async def list_invitations(
    org_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List pending invitations for the organization. Requires admin/owner."""
    service = OrganizationService(db)
    await service.verify_admin(org_id, user.id)
    return await service.get_pending_invitations(org_id)


@router.delete("/{org_id}/invitations/{invitation_id}")
async def cancel_invitation(
    org_id: int,
    invitation_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending invitation. Requires admin/owner."""
    service = OrganizationService(db)
    await service.cancel_invitation(org_id, invitation_id, user.id)
    return {"ok": True}


@router.post(
    "/{org_id}/invitations/{invitation_id}/resend",
    response_model=InvitationResponse,
)
async def resend_invitation(
    org_id: int,
    invitation_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-send a pending invitation email. Requires admin/owner."""
    service = OrganizationService(db)
    return await service.resend_invitation(org_id, invitation_id, user.id)


# -- Accept invitation (no org_id in path - uses token) --


@accept_router.get(
    "/api/invitations/preview",
    response_model=InvitationPreviewResponse,
)
async def preview_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public preview of an invitation.

    Used by the accept-invite page to show org name / inviter before the user
    signs in. Does not reveal anything an attacker couldn't obtain by already
    guessing the 32-byte token.
    """
    # Log enough to diagnose lookup mismatches without leaking the full token.
    token_preview = (token[:8] + "…") if token else "<empty>"
    logger.info(f"invitation preview lookup: token_len={len(token)} prefix={token_preview}")
    service = OrganizationService(db)
    try:
        result = await service.get_invitation_preview(token)
    except HTTPException as exc:
        logger.warning(
            f"invitation preview {exc.status_code}: {exc.detail} "
            f"(token_len={len(token)} prefix={token_preview})"
        )
        raise
    return result


@accept_router.post("/api/invitations/accept")
async def accept_invitation(
    body: AcceptInvitationRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Accept an invitation using the token."""
    service = OrganizationService(db)
    invitation = await service.accept_invitation(body.token, user.id)
    return {"ok": True, "organization_id": invitation.organization_id}


# -- Organization-level API Keys --


@router.get("/{org_id}/api-keys", response_model=list[ApiKeyResponse])
async def list_org_api_keys(
    org_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for the organization. Requires membership."""
    org_service = OrganizationService(db)
    await org_service.verify_membership(org_id, user.id)
    repo = ApiKeyRepository(db)
    return await repo.get_all(organization_id=org_id)


@router.post(
    "/{org_id}/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=201,
)
async def create_org_api_key(
    org_id: int,
    body: ApiKeyCreate = ApiKeyCreate(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new API key for the organization. Requires admin/owner."""
    org_service = OrganizationService(db)
    await org_service.verify_admin(org_id, user.id)

    key = f"flk_{secrets.token_hex(16)}"
    key_prefix = key[:8]

    repo = ApiKeyRepository(db)
    api_key = await repo.create(
        organization_id=org_id,
        key=key,
        key_prefix=key_prefix,
        name=body.name,
    )
    return api_key


@router.delete("/{org_id}/api-keys/{key_id}")
async def revoke_org_api_key(
    org_id: int,
    key_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an organization API key. Requires admin/owner."""
    org_service = OrganizationService(db)
    await org_service.verify_admin(org_id, user.id)

    repo = ApiKeyRepository(db)
    api_key = await repo.get_by_id(key_id)

    if not api_key or api_key.organization_id != org_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    await repo.update(key_id, is_active=False)
    return {"ok": True}
