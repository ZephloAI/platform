"""Lead management endpoints (agent owner facing)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.chatbot_repository import ChatbotRepository
from app.schemas.lead import LeadResponse
from app.services.lead_service import LeadService

router = APIRouter(prefix="/api", tags=["leads"])


async def _resolve_chatbot(db: AsyncSession, agent_id: str):
    """Resolve a chatbot by its public_id (UUID). Raises 404 if not found."""
    repo = ChatbotRepository(db)
    chatbot = await repo.get_by_public_id(agent_id)
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return chatbot


@router.get("/agents/{agent_id}/leads", response_model=list[LeadResponse])
async def list_leads(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List captured leads for an agent. Owners only."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = LeadService(db)
    leads = await service.list_for_agent(chatbot.id, user.id)
    return [LeadResponse.model_validate(l) for l in leads]
