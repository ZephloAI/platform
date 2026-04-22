"""
Organization service.

Business logic for organizations, memberships, and invitations.
"""

import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.invitation import Invitation
from app.models.organization import Organization
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditLogService
from app.services.resend_client import (
    ResendClient,
    ResendError,
    fallback_invite_html,
)
from app.services.usage_service import UsageService

logger = logging.getLogger(__name__)


class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.org_repo = OrganizationRepository(db)
        self.invite_repo = InvitationRepository(db)
        self.audit = AuditLogService(db)
        self.resend = ResendClient()

    # -- Organization CRUD --

    async def create_organization(self, user_id: int, name: str) -> Organization:
        """Create a new organization and add the creator."""
        slug = self._generate_slug(name, user_id)
        org = await self.org_repo.create(
            name=name,
            slug=slug,
            created_by_id=user_id,
        )
        await self.org_repo.add_member(org.id, user_id, role="creator")
        return org

    async def get_user_organizations(self, user_id: int) -> list[dict]:
        """Get all organizations the user belongs to."""
        return await self.org_repo.get_user_organizations(user_id)

    async def get_organization(self, org_id: int) -> Organization:
        """Get an organization by ID. Raises 404 if not found."""
        org = await self.org_repo.get_by_id(org_id)
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )
        return org

    # -- Membership --

    async def verify_membership(self, org_id: int, user_id: int):
        """Verify a user is a member of the org. Returns the member or raises 403."""
        member = await self.org_repo.get_member(org_id, user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization",
            )
        return member

    async def verify_admin(self, org_id: int, user_id: int):
        """Verify a user is a creator or admin. Raises 403 if not."""
        member = await self.verify_membership(org_id, user_id)
        if member.role not in ("creator", "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You need admin or creator permissions for this action",
            )
        return member

    async def get_members(self, org_id: int) -> list[dict]:
        """Get all members of an organization."""
        return await self.org_repo.get_members(org_id)

    async def remove_member(
        self, org_id: int, target_user_id: int, requesting_user_id: int
    ) -> bool:
        """Remove a member from the organization. Requires admin/owner."""
        await self.verify_admin(org_id, requesting_user_id)
        member = await self.org_repo.get_member(org_id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found",
            )
        if member.role == "creator":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the organization creator",
            )
        return await self.org_repo.remove_member(member.id)

    async def update_member_role(
        self, org_id: int, target_user_id: int, new_role: str, requesting_user_id: int
    ):
        """Update a member's role. Requires admin/owner."""
        await self.verify_admin(org_id, requesting_user_id)
        member = await self.org_repo.get_member(org_id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found",
            )
        if member.role == "creator" and new_role != "creator":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change the creator's role",
            )
        if new_role not in ("creator", "admin", "member"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be one of: creator, admin, member",
            )
        return await self.org_repo.update_role(member.id, new_role)

    # -- Invitations --

    async def invite_user(
        self, org_id: int, email: str, role: str, invited_by_id: int
    ) -> Invitation:
        """Create an invitation, send the email, and audit the send."""
        inviter = await self.verify_admin(org_id, invited_by_id)

        if role not in ("admin", "member"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation role must be admin or member",
            )

        normalized_email = email.strip().lower()

        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(days=settings.INVITE_EXPIRY_DAYS)
        invitation = await self.invite_repo.create(
            organization_id=org_id,
            email=normalized_email,
            role=role,
            token=token,
            invited_by_id=invited_by_id,
            status="pending",
            expires_at=expires_at,
            send_count=1,
            last_sent_at=now,
        )

        # Fetch inviter email for the template; best-effort, non-blocking.
        inviter_email = await self._get_user_email(invited_by_id) or "a teammate"
        organization = await self.get_organization(org_id)

        email_id = await self._send_invite_email(
            invitation=invitation,
            organization_name=organization.name,
            inviter_email=inviter_email,
        )

        await self.audit.record(
            action="invite.sent",
            organization_id=org_id,
            actor_user_id=invited_by_id,
            target_type="invitation",
            target_id=str(invitation.id),
            extra={
                "email": invitation.email,
                "role": invitation.role,
                "resend_message_id": email_id,
                "send_count": invitation.send_count,
            },
        )
        return invitation

    async def resend_invitation(
        self, org_id: int, invitation_id: int, requesting_user_id: int
    ) -> Invitation:
        """Re-send an existing pending invitation, bumping expiry + send count."""
        await self.verify_admin(org_id, requesting_user_id)

        invitation = await self.invite_repo.get_by_id(invitation_id)
        if not invitation or invitation.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )
        if invitation.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has already been accepted",
            )

        now = datetime.now(timezone.utc)
        invitation = await self.invite_repo.update(
            invitation.id,
            status="pending",
            expires_at=now + timedelta(days=settings.INVITE_EXPIRY_DAYS),
            send_count=(invitation.send_count or 0) + 1,
            last_sent_at=now,
        )

        inviter_email = await self._get_user_email(requesting_user_id) or "a teammate"
        organization = await self.get_organization(org_id)

        email_id = await self._send_invite_email(
            invitation=invitation,
            organization_name=organization.name,
            inviter_email=inviter_email,
        )

        await self.audit.record(
            action="invite.resent",
            organization_id=org_id,
            actor_user_id=requesting_user_id,
            target_type="invitation",
            target_id=str(invitation.id),
            extra={
                "email": invitation.email,
                "resend_message_id": email_id,
                "send_count": invitation.send_count,
            },
        )
        return invitation

    async def get_invitation_preview(self, token: str) -> dict:
        """
        Public (unauthenticated) preview of an invitation by token.

        Returns the org name, inviter email, and role so the accept page can
        render useful context before the user signs in.
        """
        invitation = await self.invite_repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )

        organization = await self.org_repo.get_by_id(invitation.organization_id)
        inviter_email = await self._get_user_email(invitation.invited_by_id)

        now = datetime.now(timezone.utc)
        expires_at = invitation.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        is_expired = expires_at < now or invitation.status == "expired"

        return {
            "email": invitation.email,
            "role": invitation.role,
            "status": invitation.status,
            "expires_at": invitation.expires_at,
            "is_expired": is_expired,
            "organization_name": organization.name if organization else None,
            "inviter_email": inviter_email,
        }

    async def accept_invitation(self, token: str, user_id: int) -> Invitation:
        """Accept an invitation and add the user to the organization."""
        invitation = await self.invite_repo.get_by_token(token)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )
        if invitation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation is no longer valid",
            )
        expires_at = invitation.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            await self.invite_repo.update(invitation.id, status="expired")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has expired",
            )

        # Check if already a member
        existing = await self.org_repo.get_member(invitation.organization_id, user_id)
        if existing:
            await self.invite_repo.update(
                invitation.id,
                status="accepted",
                accepted_at=datetime.now(timezone.utc),
                accepted_by_user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already a member of this organization",
            )

        # Enforce max_users BEFORE adding. The invite endpoint lives on a
        # parallel stream (todo/03-resend-invites); placing the check here
        # means the check is active at every acceptance path today and
        # survives that merge unchanged.
        usage_service = UsageService(self.db)
        await usage_service.enforce_max_users(invitation.organization_id)

        # Add user and mark invitation as accepted
        await self.org_repo.add_member(
            invitation.organization_id, user_id, role=invitation.role
        )
        invitation = await self.invite_repo.update(
            invitation.id,
            status="accepted",
            accepted_at=datetime.now(timezone.utc),
            accepted_by_user_id=user_id,
        )

        # Mark invited user as onboarding completed (they already have an org)
        user_repo = UserRepository(self.db)
        user = await user_repo.get_by_id(user_id)
        if user and not user.onboarding_completed:
            user.onboarding_completed = True
            await self.db.commit()

        await self.audit.record(
            action="invite.accepted",
            organization_id=invitation.organization_id,
            actor_user_id=user_id,
            target_type="invitation",
            target_id=str(invitation.id),
            extra={"email": invitation.email, "role": invitation.role},
        )
        return invitation

    async def get_pending_invitations(self, org_id: int) -> list:
        """Get all pending invitations for an organization."""
        return await self.invite_repo.get_pending_for_org(org_id)

    async def cancel_invitation(self, org_id: int, invitation_id: int, user_id: int):
        """Cancel a pending invitation. Requires admin/owner."""
        await self.verify_admin(org_id, user_id)
        invitation = await self.invite_repo.get_by_id(invitation_id)
        if not invitation or invitation.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found",
            )
        result = await self.invite_repo.delete(invitation_id)
        await self.audit.record(
            action="invite.cancelled",
            organization_id=org_id,
            actor_user_id=user_id,
            target_type="invitation",
            target_id=str(invitation_id),
            extra={"email": invitation.email},
        )
        return result

    # -- Helpers --

    async def _get_user_email(self, user_id: int) -> str | None:
        user_repo = UserRepository(self.db)
        user = await user_repo.get_by_id(user_id)
        return user.email if user else None

    def _build_accept_url(self, token: str) -> str:
        base = settings.INVITE_ACCEPT_URL_BASE.rstrip("/")
        return f"{base}/{token}"

    async def _send_invite_email(
        self,
        invitation: Invitation,
        organization_name: str,
        inviter_email: str,
    ) -> str | None:
        """
        Send the invite email via Resend.

        Uses the configured template id if present; falls back to inline HTML.
        Returns the Resend message id, or None if Resend is not configured or
        the send fails. We never let a failed email bubble up as a 5xx — the
        invite row is still valid and can be resent.
        """
        if not self.resend.is_configured:
            logger.warning(
                f"Resend not configured; skipping invite email to {invitation.email}"
            )
            return None

        accept_url = self._build_accept_url(invitation.token)
        subject = f"You've been invited to {organization_name}"
        try:
            if settings.RESEND_INVITE_TEMPLATE_ID:
                response = await self.resend.send_email(
                    to=invitation.email,
                    subject=subject,
                    template_id=settings.RESEND_INVITE_TEMPLATE_ID,
                    template_data={
                        "organization_name": organization_name,
                        "inviter_email": inviter_email,
                        "accept_url": accept_url,
                        "role": invitation.role,
                        "invited_email": invitation.email,
                    },
                )
            else:
                html = fallback_invite_html(
                    organization_name=organization_name,
                    inviter_email=inviter_email,
                    accept_url=accept_url,
                    role=invitation.role,
                )
                response = await self.resend.send_email(
                    to=invitation.email,
                    subject=subject,
                    html=html,
                )
            return response.get("id")
        except ResendError as exc:
            logger.error(f"Failed to send invite email to {invitation.email}: {exc}")
            return None

    def _generate_slug(self, name: str, user_id: int) -> str:
        """Generate a URL-friendly slug from the org name."""
        # Lowercase, replace spaces with hyphens, strip special chars
        slug = name.lower().strip()
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)
        slug = re.sub(r"[\s]+", "-", slug)
        slug = re.sub(r"-+", "-", slug).strip("-")
        # Append user_id to ensure uniqueness
        return f"{slug}-{user_id}" if slug else f"org-{user_id}"
