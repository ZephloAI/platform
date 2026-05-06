"""
User-related Pydantic schemas.

These define the shape of data for user registration, login, and responses.
"""

from pydantic import BaseModel, ConfigDict, EmailStr


class OAuthRequest(BaseModel):
    """Schema for OAuth login — provider name and ID token."""
    provider: str
    id_token: str
    # If present, accept this invitation atomically as part of the OAuth
    # sign-up. Lets invited users land directly in the inviting org instead
    # of needing to create a personal one first.
    invitation_token: str | None = None


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    # Same purpose as OAuthRequest.invitation_token — when present, the new
    # user joins the inviting org instead of getting a personal org.
    invitation_token: str | None = None


class LoginRequest(BaseModel):
    """Schema for user login — only email and password required."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for returning user data (no password)."""
    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    onboarding_completed: bool = False
    is_platform_admin: bool = False

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    """Schema for login response (includes JWT token)."""
    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    onboarding_completed: bool = False
    is_platform_admin: bool = False
    token: str
    organization_id: int | None = None


class ForgotPasswordRequest(BaseModel):
    """Schema for starting a password reset — just the email."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema for completing a password reset with a one-time token."""
    token: str
    new_password: str


class GenericMessageResponse(BaseModel):
    """A neutral response body used when we don't want to leak state."""
    message: str
