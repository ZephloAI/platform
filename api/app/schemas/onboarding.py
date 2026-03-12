"""
Onboarding-related Pydantic schemas.
"""

from pydantic import BaseModel, EmailStr


class OnboardingTeamMember(BaseModel):
    """A team member to invite during onboarding."""
    email: EmailStr
    role: str = "member"


class OnboardingRequest(BaseModel):
    """Schema for completing the onboarding flow."""
    phone: str | None = None
    country: str | None = None
    organization_name: str
    organization_size: str | None = None
    organization_phone: str | None = None
    team_members: list[OnboardingTeamMember] = []
