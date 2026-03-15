"""
Organizations router - CRUD endpoints for organization management.

All endpoints require authentication (get_current_user dependency).
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession as SASession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chatbot import Chatbot
from app.models.user import User
from app.repositories.api_key_repository import ApiKeyRepository
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.schemas.chatbot import ChatbotMetrics
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationMemberResponse,
    InvitationCreate,
    InvitationResponse,
    AcceptInvitationRequest,
    UpdateMemberRoleRequest,
)
from app.services.organization_service import OrganizationService

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


# -- Members --


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


# -- Accept invitation (no org_id in path - uses token) --


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
