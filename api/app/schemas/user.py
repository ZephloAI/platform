"""
User-related Pydantic schemas.

These define the shape of data for user registration, login, and responses.
"""

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str
    first_name: str
    last_name: str


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

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    """Schema for login response (includes JWT token)."""
    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    onboarding_completed: bool = False
    token: str
    organization_id: int | None = None
