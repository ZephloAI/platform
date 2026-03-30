"""
Authentication service.

Handles user registration, login, password hashing, and JWT token
creation/verification. Uses UserRepository for database access.
"""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.organization_service import OrganizationService

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    # -- Public methods --

    async def register(
        self, email: str, password: str, first_name: str, last_name: str
    ) -> dict:
        """
        Register a new user.

        1. Check if the email is already taken
        2. Hash the password
        3. Create the user record
        4. Generate a JWT token
        5. Return user info + token

        Raises 400 if email is already registered.
        """
        # Check for existing user
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        # Hash password and create user
        password_hash = pwd_context.hash(password)
        user = await self.user_repo.create(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
        )

        # Auto-create a default organization for the new user
        org_service = OrganizationService(self.db)
        org = await org_service.create_organization(
            user_id=user.id,
            name=f"{email}'s Organization",
        )

        # Generate token and return response
        token = self._create_token(user.id)
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "onboarding_completed": user.onboarding_completed,
            "token": token,
            "organization_id": org.id,
        }

    async def login(self, email: str, password: str) -> dict:
        """
        Authenticate a user with email and password.

        Raises 401 if credentials are invalid.
        """
        user = await self.user_repo.get_by_email(email)
        if not user or not user.password_hash or not pwd_context.verify(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        # Get user's first organization
        org_service = OrganizationService(self.db)
        orgs = await org_service.get_user_organizations(user.id)
        org_id = orgs[0]["id"] if orgs else None

        token = self._create_token(user.id)
        return {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "onboarding_completed": user.onboarding_completed,
            "token": token,
            "organization_id": org_id,
        }

    async def get_current_user(self, token: str) -> User | None:
        """
        Decode a JWT token and return the corresponding user.

        Returns None if the token is invalid or the user doesn't exist.
        """
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
            )
            user_id_raw = payload.get("sub")
            if user_id_raw is None:
                return None
            user_id = int(user_id_raw)
            if user_id is None:
                return None
        except JWTError:
            return None

        return await self.user_repo.get_by_id(user_id)

    # -- Private helpers --

    def _create_token(self, user_id: int) -> str:
        """Create a JWT token with the user's ID as the subject."""
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_EXPIRE_MINUTES
        )
        payload = {"sub": str(user_id), "exp": expire}
        return jwt.encode(
            payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )
