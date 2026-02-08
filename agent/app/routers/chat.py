"""
Chat router - handles the main chat endpoint.

This is the entry point for all chat messages. Users send a chatbot_id
and a message, and get back the AI-generated response with source URLs.

Endpoint:
    POST /api/chat  ->  { chatbot_id, message }  ->  { response, sources }
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
        chatbot_id: Which chatbot to use (maps to a Qdrant collection).
        message:    The user's question or message.
    """

    chatbot_id: int
    chatbot_name: str = ""
    message: str


class ChatSource(BaseModel):
    """
    A source URL referenced in the response.

    Attributes:
        url:   Full URL of the source page.
        title: Title of the source page.
    """

    url: str
    title: str


class ChatResponse(BaseModel):
    """
    What the chat endpoint returns to the client.

    Attributes:
        response: The AI-generated answer text.
        sources:  List of source pages the answer was based on.
    """

    response: str
    sources: list[ChatSource] = []


# ──────────────────────────────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────────────────────────────


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to a chatbot and get an AI-generated response.

    How it works:
    1. Takes the chatbot_id and user message from the request.
    2. Retrieves relevant website content from Qdrant (RAG).
    3. Sends context + question to the LLM via the Agno agent.
    4. Returns the response with source URLs.

    Raises:
        HTTPException 500: If something goes wrong during processing.
    """
    try:
        result = await chat_with_agent(request.chatbot_id, request.message, chatbot_name=request.chatbot_name)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
