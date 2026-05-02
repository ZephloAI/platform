"""
API Keys router - manage API keys for chatbots.

All endpoints require dashboard authentication (get_current_user).
Chatbot ownership is verified before any operation.
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.api_key_repository import ApiKeyRepository
from app.repositories.chatbot_repository import ChatbotRepository
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/api/agents", tags=["api-keys"])


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


@router.get("/{agent_id}/preview-key", response_model=ApiKeyCreatedResponse)
async def get_or_create_preview_key(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return a working API key the dashboard can use for the in-app live preview.

    Picks any active (non-revoked) key for the chatbot, preferring an existing
    "Preview" key. Falls back to creating a new "Preview" key only when no
    active key exists. Revoked keys are never reused.
    Always returns the full plaintext key so the preview can authenticate the widget.
    """
    chatbot = await _resolve_chatbot(db, agent_id)
    service = ChatbotService(db)
    await service.get_chatbot(chatbot.id, user.id)

    repo = ApiKeyRepository(db)
    active_keys = [k for k in await repo.get_all_for_chatbot(chatbot.id) if k.is_active]

    preview_key = next((k for k in active_keys if k.name == "Preview"), None)
    if preview_key:
        return preview_key
    if active_keys:
        return active_keys[0]

    key = f"flk_{secrets.token_hex(16)}"
    return await repo.create(
        chatbot_id=chatbot.id,
        organization_id=chatbot.organization_id,
        key=key,
        key_prefix=key[:8],
        name="Preview",
    )


@router.get("/{agent_id}/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for a chatbot."""
    chatbot = await _resolve_chatbot(db, agent_id)
    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot.id, user.id)

    repo = ApiKeyRepository(db)
    return await repo.get_all_for_chatbot(chatbot.id)


@router.post(
    "/{agent_id}/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=201,
)
async def create_api_key(
    agent_id: str,
    body: ApiKeyCreate = ApiKeyCreate(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new API key for a chatbot.

    The full key is returned only once in this response.
    Store it securely - it cannot be retrieved again.
    """
    chatbot = await _resolve_chatbot(db, agent_id)
    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot.id, user.id)

    # Generate key
    key = f"flk_{secrets.token_hex(16)}"
    key_prefix = key[:8]

    repo = ApiKeyRepository(db)
    api_key = await repo.create(
        chatbot_id=chatbot.id,
        organization_id=chatbot.organization_id,
        key=key,
        key_prefix=key_prefix,
        name=body.name,
    )
    return api_key


@router.delete("/{agent_id}/api-keys/{key_id}")
async def revoke_api_key(
    agent_id: str,
    key_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke (soft-delete) an API key by setting is_active to False."""
    chatbot = await _resolve_chatbot(db, agent_id)
    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot.id, user.id)

    repo = ApiKeyRepository(db)
    api_key = await repo.get_by_id(key_id)

    if not api_key or api_key.chatbot_id != chatbot.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    await repo.update(key_id, is_active=False)
    return {"ok": True}
