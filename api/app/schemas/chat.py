"""
Chat-related Pydantic schemas.
"""

from pydantic import BaseModel


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
