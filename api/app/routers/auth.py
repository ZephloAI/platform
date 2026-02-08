"""
Auth router - registration and login endpoints.

These are public endpoints (no authentication required).

Flow:
  Router receives request
  -> AuthService handles business logic
  -> UserRepository accesses the database
  -> Response returned to client
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate, LoginResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=LoginResponse)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user account.

    - Validates email format and password length (min 6 chars)
    - Hashes the password with bcrypt
    - Returns user info + JWT token

    Raises 400 if the email is already taken.
    """
    auth_service = AuthService(db)
    return await auth_service.register(body.email, body.password)


@router.post("/login", response_model=LoginResponse)
async def login(body: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Log in with email and password.

    - Verifies the password against the stored hash
    - Returns user info + JWT token

    Raises 401 if credentials are invalid.
    """
    auth_service = AuthService(db)
    return await auth_service.login(body.email, body.password)
