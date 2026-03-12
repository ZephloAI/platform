"""
API Key Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ApiKeyCreate(BaseModel):
    """Schema for creating a new API key."""
    name: str = "Default"


class ApiKeyResponse(BaseModel):
    """Schema for API key responses (key is hidden)."""
    id: int
    chatbot_id: int | None = None
    organization_id: int | None = None
    key_prefix: str
    name: str
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreatedResponse(ApiKeyResponse):
    """Schema returned when a key is first created (includes full key, shown only once)."""
    key: str
