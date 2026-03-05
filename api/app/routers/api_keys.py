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
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreatedResponse
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/api/chatbots", tags=["api-keys"])


@router.get("/{chatbot_id}/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for a chatbot."""
    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot_id, user.id)

    repo = ApiKeyRepository(db)
    return await repo.get_all_for_chatbot(chatbot_id)


@router.post(
    "/{chatbot_id}/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=201,
)
async def create_api_key(
    chatbot_id: int,
    body: ApiKeyCreate = ApiKeyCreate(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new API key for a chatbot.

    The full key is returned only once in this response.
    Store it securely - it cannot be retrieved again.
    """
    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot_id, user.id)

    # Generate key
    key = f"flk_{secrets.token_hex(16)}"
    key_prefix = key[:8]

    repo = ApiKeyRepository(db)
    api_key = await repo.create(
        chatbot_id=chatbot_id,
        key=key,
        key_prefix=key_prefix,
        name=body.name,
    )
    return api_key


@router.delete("/{chatbot_id}/api-keys/{key_id}")
async def revoke_api_key(
    chatbot_id: int,
    key_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke (soft-delete) an API key by setting is_active to False."""
    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot_id, user.id)

    repo = ApiKeyRepository(db)
    api_key = await repo.get_by_id(key_id)

    if not api_key or api_key.chatbot_id != chatbot_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )

    await repo.update(key_id, is_active=False)
    return {"ok": True}
