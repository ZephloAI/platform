"""
Main FastAPI application for the Agent Service.

This service handles chat requests by:
1. Receiving a user's question + chatbot ID.
2. Retrieving relevant website content from Qdrant (vector search).
3. Generating an AI response using the Agno agent + OpenRouter LLM.
4. Returning the answer with source URLs.

Run locally with:
    uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, ws_chat

# ──────────────────────────────────────────────────────────────────────
# Create the FastAPI application
# ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Chatbot Agent Service",
    description="RAG-powered chatbot agent that answers questions using website content.",
    version="1.0.0",
)

# ──────────────────────────────────────────────────────────────────────
# CORS middleware - allows requests from any origin.
# In production, restrict allow_origins to your frontend domain.
# ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────
# Register routers
# ──────────────────────────────────────────────────────────────────────

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(ws_chat.router, tags=["websocket"])


# ──────────────────────────────────────────────────────────────────────
# Health check endpoint
# ──────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    """Simple health check to verify the service is running."""
    return {"status": "ok", "service": "agent"}