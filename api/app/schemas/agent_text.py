"""AgentText-related Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AgentTextCreate(BaseModel):
    """Schema for creating a new raw text knowledge source."""
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class AgentTextUpdate(BaseModel):
    """Schema for editing an existing text snippet."""
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


class AgentTextResponse(BaseModel):
    """Schema for agent text responses."""
    id: int
    chatbot_id: int
    title: str
    content: str
    status: str
    chunks_indexed: int
    created_at: datetime
    processed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AgentTextStatusUpdate(BaseModel):
    """Schema for crawler callback to update agent text status."""
    status: str
    chunks_indexed: int = 0
    error: str | None = None
