"""
Organization-related Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrganizationCreate(BaseModel):
    """Schema for creating a new organization."""
    name: str


class OrganizationResponse(BaseModel):
    """Schema for organization responses."""
    id: int
    name: str
    slug: str
    created_at: datetime
    role: str | None = None  # The current user's role in the org

    model_config = ConfigDict(from_attributes=True)


class OrganizationMemberResponse(BaseModel):
    """Schema for organization member responses."""
    id: int
    user_id: int
    email: str
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvitationCreate(BaseModel):
    """Schema for creating a new invitation."""
    email: str
    role: str = "member"


class InvitationResponse(BaseModel):
    """Schema for invitation responses."""
    id: int
    email: str
    role: str
    status: str
    created_at: datetime
    expires_at: datetime
    send_count: int = 1
    last_sent_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class InvitationPreviewResponse(BaseModel):
    """Public preview of an invitation — shown on the accept page before sign-in."""
    email: str
    role: str
    status: str
    expires_at: datetime
    is_expired: bool
    organization_name: str | None = None
    inviter_email: str | None = None


class AcceptInvitationRequest(BaseModel):
    """Schema for accepting an invitation."""
    token: str


class UpdateMemberRoleRequest(BaseModel):
    """Schema for updating a member's role."""
    role: str
