"""Document-related Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    """Schema for document responses."""
    id: int
    chatbot_id: int
    filename: str
    s3_url: str
    file_size: int
    status: str
    chunks_indexed: int
    uploaded_at: datetime
    processed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DocumentStatusUpdate(BaseModel):
    """Schema for crawler callback to update document status."""
    status: str
    document_id: int
    chunks_indexed: int = 0
    error: str | None = None
