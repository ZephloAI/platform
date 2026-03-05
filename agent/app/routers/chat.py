"""
Chat router - handles the main chat endpoint.

This is the entry point for all chat messages. Users send a chatbot_id,
message, and optional session_id, and get back the AI-generated response
with source URLs and the session_id for continuing the conversation.

Endpoint:
    POST /api/chat  ->  { chatbot_id, message, session_id? }  ->  { response, sources, session_id }
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agent import chat_with_agent

router = APIRouter()


# ──────────────────────────────────────────────────────────────────────
# Request and response models
# ──────────────────────────────────────────────────────────────────────


class ChatRequest(BaseModel):
    """
    What the client sends to the chat endpoint.

    Attributes:
        chatbot_id:   Which chatbot to use (maps to a Qdrant collection).
        chatbot_name: Name of the chatbot (for collection lookup + persona).
        message:      The user's question or message.
        session_id:   Optional UUID to continue an existing conversation.
    """

    chatbot_id: int
    chatbot_name: str = ""
    message: str
    session_id: str | None = None
    follow_up_prompts: list[dict] = []
    instructions: str | None = None


class ChatSource(BaseModel):
    """A source URL referenced in the response."""

    url: str
    title: str


class FollowUpPrompt(BaseModel):
    """A follow-up prompt suggested after an assistant response."""

    title: str
    link: str | None = None
    prompt: str | None = None


class McpToolResult(BaseModel):
    """An MCP tool result containing _meta.ui_path for host-page rendering."""

    tool_name: str
    meta: dict
    content: str


class ChatResponse(BaseModel):
    """
    What the chat endpoint returns to the client.

    Attributes:
        response:          The AI-generated answer text.
        sources:           List of source pages the answer was based on.
        session_id:        The session ID for this conversation thread.
        follow_up_prompts: Contextually selected follow-up prompts.
        mcp_results:       MCP tool results with _meta.ui_path for host-page rendering.
    """

    response: str
    sources: list[ChatSource] = []
    session_id: str | None = None
    follow_up_prompts: list[FollowUpPrompt] = []
    mcp_results: list[McpToolResult] | None = None


# ──────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to a chatbot and get an AI-generated response.

    If session_id is provided, the agent loads conversation history
    from that session. If omitted, a new session is created.
    The response always includes the session_id so the client can
    continue the conversation.
    """
    try:
        result = await chat_with_agent(
            request.chatbot_id,
            request.message,
            chatbot_name=request.chatbot_name,
            session_id=request.session_id,
            follow_up_prompts=request.follow_up_prompts,
            custom_instructions=request.instructions,
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
