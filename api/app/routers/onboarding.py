"""
Onboarding router - post-signup onboarding endpoint.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.onboarding import OnboardingRequest
from app.services.onboarding_service import OnboardingService

router = APIRouter(prefix="/api", tags=["onboarding"])


@router.post("/onboarding")
async def complete_onboarding(
    body: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Complete the post-signup onboarding flow."""
    service = OnboardingService(db)
    return await service.complete_onboarding(current_user.id, body)
