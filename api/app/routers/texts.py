"""Raw text knowledge source endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.chatbot_repository import ChatbotRepository
from app.schemas.agent_text import (
    AgentTextCreate,
    AgentTextResponse,
    AgentTextStatusUpdate,
    AgentTextUpdate,
)
from app.services.text_service import TextService

router = APIRouter(prefix="/api", tags=["texts"])


async def _resolve_chatbot(db: AsyncSession, agent_id: str):
    """Resolve a chatbot by its public_id. Raises 404 if not found."""
    repo = ChatbotRepository(db)
    chatbot = await repo.get_by_public_id(agent_id)
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return chatbot


@router.post(
    "/agents/{agent_id}/texts",
    response_model=AgentTextResponse,
)
async def create_text(
    agent_id: str,
    body: AgentTextCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a raw text snippet to the agent's knowledge base."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = TextService(db)
    return await service.upload(chatbot.id, user.id, body.title, body.content)


@router.get(
    "/agents/{agent_id}/texts",
    response_model=list[AgentTextResponse],
)
async def list_texts(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all text snippets for an agent."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = TextService(db)
    return await service.list_texts(chatbot.id, user.id)


@router.put(
    "/agents/{agent_id}/texts/{text_id}",
    response_model=AgentTextResponse,
)
async def update_text(
    agent_id: str,
    text_id: int,
    body: AgentTextUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Edit a text snippet's title and content; triggers a fresh re-index."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = TextService(db)
    return await service.update(chatbot.id, text_id, user.id, body.title, body.content)


@router.delete("/agents/{agent_id}/texts/{text_id}")
async def delete_text(
    agent_id: str,
    text_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a text snippet from the agent's knowledge base."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = TextService(db)
    await service.delete_text(chatbot.id, text_id, user.id)
    return {"ok": True}


@router.patch("/internal/agent-texts/{text_id}")
async def update_text_status(
    text_id: int,
    body: AgentTextStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Crawler callback to update text processing status."""
    service = TextService(db)
    await service.update_status(
        text_id=text_id,
        text_status=body.status,
        chunks_indexed=body.chunks_indexed,
        error=body.error,
    )
    return {"ok": True}
