"""
Organization service.

Business logic for organizations, memberships, and invitations.
"""

import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.invitation_repository import InvitationRepository


class OrganizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.org_repo = OrganizationRepository(db)
        self.invite_repo = InvitationRepository(db)

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
    ):
        """Create an invitation to join the organization."""
        await self.verify_admin(org_id, invited_by_id)

        if role not in ("admin", "member"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation role must be admin or member",
            )

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        invitation = await self.invite_repo.create(
            organization_id=org_id,
            email=email,
            role=role,
            token=token,
            invited_by_id=invited_by_id,
            status="pending",
            expires_at=expires_at,
        )
        return invitation

    async def accept_invitation(self, token: str, user_id: int):
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
        if invitation.expires_at < datetime.now(timezone.utc):
            await self.invite_repo.update(invitation.id, status="expired")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation has expired",
            )

        # Check if already a member
        existing = await self.org_repo.get_member(invitation.organization_id, user_id)
        if existing:
            await self.invite_repo.update(invitation.id, status="accepted")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are already a member of this organization",
            )

        # Add user and mark invitation as accepted
        await self.org_repo.add_member(
            invitation.organization_id, user_id, role=invitation.role
        )
        await self.invite_repo.update(invitation.id, status="accepted")

        # Mark invited user as onboarding completed (they already have an org)
        from app.repositories.user_repository import UserRepository
        user_repo = UserRepository(self.db)
        user = await user_repo.get_by_id(user_id)
        if user and not user.onboarding_completed:
            user.onboarding_completed = True
            await self.db.commit()

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
        return await self.invite_repo.delete(invitation_id)

    # -- Helpers --

    def _generate_slug(self, name: str, user_id: int) -> str:
        """Generate a URL-friendly slug from the org name."""
        # Lowercase, replace spaces with hyphens, strip special chars
        slug = name.lower().strip()
        slug = re.sub(r"[^a-z0-9\s-]", "", slug)
        slug = re.sub(r"[\s]+", "-", slug)
        slug = re.sub(r"-+", "-", slug).strip("-")
        # Append user_id to ensure uniqueness
        return f"{slug}-{user_id}" if slug else f"org-{user_id}"
