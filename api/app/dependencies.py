"""
Shared FastAPI dependencies.

Provides:
- get_current_user: JWT auth for dashboard endpoints
- get_current_organization: org membership verification
- validate_api_key: API key auth for public/widget endpoints
"""

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.auth_service import AuthService

# HTTPBearer extracts the token from "Authorization: Bearer <token>"
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency: decode JWT and return the current user.

    Raises 401 if the token is invalid or the user doesn't exist.

    Usage:
        @router.get("/me")
        async def me(user: User = Depends(get_current_user)):
            return user
    """
    token = credentials.credentials
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user


async def validate_api_key(
    x_api_key: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency: validate an optional X-API-Key header.

    Returns the ApiKey record if a valid key is provided, or None if
    the header is absent (allowing backward-compatible unauthenticated access).
    Raises 401 if a key is provided but invalid or revoked.

    Usage:
        @router.get("/something")
        async def endpoint(api_key = Depends(validate_api_key)):
            ...
    """
    if x_api_key is None:
        return None

    from app.repositories.api_key_repository import ApiKeyRepository

    repo = ApiKeyRepository(db)
    api_key = await repo.get_by_key(x_api_key)

    if not api_key or not api_key.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
        )

    # Update last used timestamp in the background
    await repo.update_last_used(api_key.id)

    return api_key


async def get_current_organization(
    org_id: int,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    FastAPI dependency: verify the user is a member of the given organization.

    Returns the Organization record if the user is a member.
    Raises 403 if not a member, 404 if org not found.
    """
    from app.services.organization_service import OrganizationService

    org_service = OrganizationService(db)
    org = await org_service.get_organization(org_id)
    await org_service.verify_membership(org_id, user.id)
    return org


async def require_platform_admin(user=Depends(get_current_user)):
    """
    FastAPI dependency: only allow users with is_platform_admin=True.

    Used to gate the admin-only routers.
    """
    if not getattr(user, "is_platform_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required",
        )
    return user
