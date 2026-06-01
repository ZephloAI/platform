"""Pydantic schemas for lead capture."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class LeadCreate(BaseModel):
    """Body the agent service POSTs to /api/internal/leads.

    All capture fields are optional — the agent calls the endpoint
    multiple times as it learns more, and the row is built up over time.
    """

    chatbot_id: int
    session_id: UUID
    name: str | None = None
    email: EmailStr | None = None  # validated only when present
    phone: str | None = None
    company: str | None = None
    interest: str | None = None

    @field_validator("name", "phone", "company", "interest")
    @classmethod
    def _empty_to_none(cls, v: str | None) -> str | None:
        # Treat empty/whitespace strings as "not provided" so the upsert
        # never blanks an existing value.
        if v is None:
            return None
        v = v.strip()
        return v or None


class LeadResponse(BaseModel):
    """Lead row as returned to the agent owner."""

    id: int
    public_id: str
    chatbot_id: int
    session_id: UUID
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    interest: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
