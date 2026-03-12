"""
Chat-related Pydantic schemas.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class ChatRequest(BaseModel):
    """Schema for sending a chat message."""
    chatbot_id: int
    message: str
    session_id: str | None = None


class ChatSource(BaseModel):
    """A source page referenced in the chat response."""
    url: str
    title: str


class FollowUpPrompt(BaseModel):
    """A follow-up prompt suggested after an assistant response."""
    title: str
    link: str | None = None
    prompt: str | None = None


class ChatResponse(BaseModel):
    """Schema for the chat response from the agent service."""
    response: str
    sources: list[ChatSource] = []
    session_id: str | None = None
    follow_up_prompts: list[FollowUpPrompt] = []


# --- Conversation / admin live-chat schemas ---


class MessageResponse(BaseModel):
    """A single chat message returned to the client."""
    id: int
    session_id: str
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionListItem(BaseModel):
    """Summary of a chat session shown in the conversations list."""
    id: str
    chatbot_id: int
    mode: str
    is_unread: bool
    created_at: datetime
    updated_at: datetime | None = None
    last_message: str | None = None
    last_message_at: datetime | None = None
    message_count: int

    model_config = ConfigDict(from_attributes=True)


class SessionDetailResponse(BaseModel):
    """Full session with its message history."""
    id: str
    chatbot_id: int
    mode: str
    is_unread: bool
    admin_id: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    messages: list[MessageResponse]

    model_config = ConfigDict(from_attributes=True)


class AdminMessageRequest(BaseModel):
    """Body for an admin sending a message in a conversation."""
    content: str


class SwitchModeRequest(BaseModel):
    """Body for switching a session between AI and person mode."""
    mode: str

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        if v not in ("ai", "person"):
            raise ValueError("mode must be 'ai' or 'person'")
        return v


class InternalMessageRequest(BaseModel):
    """Body used by the agent service to store messages."""
    session_id: str
    role: str
    content: str
