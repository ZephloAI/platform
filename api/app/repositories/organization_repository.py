"""
Organization repository - database access for Organization and OrganizationMember models.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Organization)

    async def get_by_slug(self, slug: str) -> Organization | None:
        """Get an organization by its slug."""
        result = await self.db.execute(
            select(Organization).where(Organization.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_user_organizations(self, user_id: int) -> list[dict]:
        """Get all organizations the user belongs to, with their role."""
        result = await self.db.execute(
            select(Organization, OrganizationMember.role)
            .join(
                OrganizationMember,
                OrganizationMember.organization_id == Organization.id,
            )
            .where(OrganizationMember.user_id == user_id)
        )
        rows = result.all()
        orgs = []
        for org, role in rows:
            orgs.append({
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "created_at": org.created_at,
                "role": role,
            })
        return orgs

    async def get_members(self, org_id: int) -> list[dict]:
        """Get all members of an organization with their user email."""
        result = await self.db.execute(
            select(OrganizationMember, User.email)
            .join(User, User.id == OrganizationMember.user_id)
            .where(OrganizationMember.organization_id == org_id)
        )
        rows = result.all()
        members = []
        for member, email in rows:
            members.append({
                "id": member.id,
                "user_id": member.user_id,
                "email": email,
                "role": member.role,
                "joined_at": member.joined_at,
            })
        return members

    async def get_member(self, org_id: int, user_id: int) -> OrganizationMember | None:
        """Get a single membership record."""
        result = await self.db.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_member(
        self, org_id: int, user_id: int, role: str = "member"
    ) -> OrganizationMember:
        """Add a user as a member of the organization."""
        member = OrganizationMember(
            organization_id=org_id,
            user_id=user_id,
            role=role,
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def remove_member(self, member_id: int) -> bool:
        """Remove a member from the organization."""
        result = await self.db.execute(
            select(OrganizationMember).where(OrganizationMember.id == member_id)
        )
        member = result.scalar_one_or_none()
        if member:
            await self.db.delete(member)
            await self.db.commit()
            return True
        return False

    async def update_role(self, member_id: int, role: str) -> OrganizationMember | None:
        """Update a member's role."""
        result = await self.db.execute(
            select(OrganizationMember).where(OrganizationMember.id == member_id)
        )
        member = result.scalar_one_or_none()
        if member:
            member.role = role
            await self.db.commit()
            await self.db.refresh(member)
        return member
