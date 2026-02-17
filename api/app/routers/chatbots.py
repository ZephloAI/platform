"""
Chatbots router - CRUD endpoints for chatbot management.

All endpoints require authentication (get_current_user dependency).

Flow:
  Router receives request + authenticated user
  -> ChatbotService handles business logic + ownership checks
  -> ChatbotRepository accesses the database
  -> Response returned to client
"""

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.chatbot import (
    ChatbotCreate,
    ChatbotResponse,
    ChatbotDetailResponse,
    WidgetSettingsUpdate,
    WidgetSettingsResponse,
)
from app.services.chatbot_service import ChatbotService

router = APIRouter(prefix="/api/chatbots", tags=["chatbots"])


@router.get("", response_model=list[ChatbotResponse])
async def list_chatbots(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all chatbots for the current user.

    Returns only chatbots owned by the authenticated user.
    """
    service = ChatbotService(db)
    return await service.list_chatbots(user.id)


@router.post("", response_model=ChatbotResponse, status_code=201)
async def create_chatbot(
    body: ChatbotCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new chatbot.

    The chatbot starts with status "pending" until a crawl is triggered.
    """
    service = ChatbotService(db)
    return await service.create_chatbot(
        user_id=user.id,
        name=body.name,
    )


@router.get("/{chatbot_id}", response_model=ChatbotDetailResponse)
async def get_chatbot(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single chatbot with its crawl job history.

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    """
    service = ChatbotService(db)
    return await service.get_chatbot(chatbot_id, user.id)


@router.get("/{chatbot_id}/widget-settings", response_model=WidgetSettingsResponse)
async def get_widget_settings(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get widget customization settings for a chatbot."""
    service = ChatbotService(db)
    return await service.get_chatbot(chatbot_id, user.id)


@router.put("/{chatbot_id}/widget-settings", response_model=WidgetSettingsResponse)
async def update_widget_settings(
    chatbot_id: int,
    body: WidgetSettingsUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update widget customization settings for a chatbot."""
    service = ChatbotService(db)
    return await service.update_widget_settings(chatbot_id, user.id, body)


@router.post("/{chatbot_id}/logo")
async def upload_logo(
    chatbot_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a logo image for the chatbot widget."""
    # Validate file type
    allowed_types = {"image/png", "image/jpeg", "image/svg+xml", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be PNG, JPG, SVG, or WebP",
        )

    # Validate file size (2MB)
    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be smaller than 2MB",
        )
    await file.seek(0)

    # Verify ownership
    service = ChatbotService(db)
    await service.get_chatbot(chatbot_id, user.id)

    # Upload to S3
    from app.services.s3_storage import upload_logo as do_upload
    url = await do_upload(file, chatbot_id)

    # Update chatbot record
    from app.repositories.chatbot_repository import ChatbotRepository
    repo = ChatbotRepository(db)
    await repo.update(chatbot_id, widget_logo_url=url)

    return {"url": url}


@router.delete("/{chatbot_id}")
async def delete_chatbot(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a chatbot and all its associated data (crawl jobs, pages).

    Raises 404 if the chatbot doesn't exist or doesn't belong to the user.
    """
    service = ChatbotService(db)
    await service.delete_chatbot(chatbot_id, user.id)
    return {"ok": True}
