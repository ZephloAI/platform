"""
Shared FastAPI dependencies.

Provides the `get_current_user` dependency used by protected endpoints.
It extracts the JWT token from the Authorization header, decodes it,
and returns the authenticated User object.
"""

from fastapi import Depends, HTTPException, status
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
