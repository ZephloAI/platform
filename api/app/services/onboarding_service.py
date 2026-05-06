"""
Onboarding service.

Handles completing the post-signup onboarding flow:
updating user profile, organization details, and sending team invitations.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import UserRepository
from app.services.organization_service import OrganizationService
from app.schemas.onboarding import OnboardingRequest

logger = logging.getLogger(__name__)


class OnboardingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.org_service = OrganizationService(db)

    async def complete_onboarding(self, user_id: int, data: OnboardingRequest) -> dict:
        """
        Complete the onboarding flow for a new user.

        1. Update user profile fields (phone, country)
        2. Resolve the user's organization — create it if they don't have
           one yet (the new default), otherwise update the existing one
        3. Send invitations for team members
        4. Mark onboarding as completed
        """
        # 1. Update user profile
        user = await self.user_repo.get_by_id(user_id)
        if data.phone is not None:
            user.phone = data.phone
        if data.country is not None:
            user.country = data.country

        # 2. Resolve org: create-if-missing, otherwise update.
        orgs = await self.org_service.get_user_organizations(user_id)
        if orgs:
            org = await self.org_service.get_organization(orgs[0]["id"])
            org.name = data.organization_name
            org.slug = self.org_service._generate_slug(data.organization_name, user_id)
        else:
            org = await self.org_service.create_organization(
                user_id=user_id,
                name=data.organization_name,
            )
        if data.organization_size is not None:
            org.size = data.organization_size
        if data.organization_phone is not None:
            org.phone = data.organization_phone

        # 3. Send team invitations (skip failures silently)
        for member in data.team_members:
            try:
                await self.org_service.invite_user(
                    org_id=org.id,
                    email=member.email,
                    role=member.role,
                    invited_by_id=user_id,
                )
            except Exception:
                logger.warning(f"Failed to send invitation to {member.email}")

        # 4. Mark onboarding as completed
        user.onboarding_completed = True
        await self.db.commit()

        return {"status": "ok"}
