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
from app.schemas.user import UserCreate, LoginRequest, LoginResponse, OAuthRequest
from app.services.auth_service import AuthService
from app.services.oauth_service import OAuthService

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
    return await auth_service.register(
        body.email, body.password, body.first_name, body.last_name
    )


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Log in with email and password.

    - Verifies the password against the stored hash
    - Returns user info + JWT token

    Raises 401 if credentials are invalid.
    """
    auth_service = AuthService(db)
    return await auth_service.login(body.email, body.password)


@router.post("/oauth", response_model=LoginResponse)
async def oauth_login(body: OAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Log in or register via an OAuth provider (Google or Microsoft).

    - Verifies the provider's ID token
    - Finds or creates the user account
    - Returns user info + JWT token
    """
    oauth_service = OAuthService(db)
    return await oauth_service.authenticate(body.provider, body.id_token)
