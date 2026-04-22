"""
OAuth authentication service.

Handles Google and Microsoft OAuth login by verifying ID tokens,
finding or creating the user, and returning a JWT.
"""

from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import jwt as jose_jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.oauth_provider import UserOAuthProvider
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.organization_service import OrganizationService


class OAuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def authenticate(self, provider: str, id_token: str) -> dict:
        """
        Main entry point for OAuth login.

        1. Verify the ID token with the provider
        2. Find or create the user
        3. Return user info + JWT token
        """
        if provider == "google":
            token_data = self._verify_google_token(id_token)
        elif provider == "microsoft":
            token_data = await self._verify_microsoft_token(id_token)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported OAuth provider: {provider}",
            )

        user = await self._find_or_create_user(
            provider=provider,
            provider_user_id=token_data["sub"],
            email=token_data["email"],
            first_name=token_data["first_name"],
            last_name=token_data["last_name"],
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
            "is_platform_admin": user.is_platform_admin,
            "token": token,
            "organization_id": org_id,
        }

    def _verify_google_token(self, token: str) -> dict:
        """Verify a Google OAuth ID token and extract user info."""
        try:
            payload = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {e}",
            )

        return {
            "email": payload["email"],
            "first_name": payload.get("given_name", ""),
            "last_name": payload.get("family_name", ""),
            "sub": payload["sub"],
        }

    async def _verify_microsoft_token(self, token: str) -> dict:
        """Verify a Microsoft OAuth ID token and extract user info."""
        jwks_url = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}/discovery/v2.0/keys"

        async with httpx.AsyncClient() as client:
            resp = await client.get(jwks_url)
            resp.raise_for_status()
            jwks = resp.json()

        try:
            # Decode header to find the matching key
            unverified_header = jose_jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")

            # Find the matching key in JWKS
            rsa_key = None
            for key in jwks.get("keys", []):
                if key["kid"] == kid:
                    rsa_key = key
                    break

            if not rsa_key:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Unable to find matching Microsoft signing key",
                )

            payload = jose_jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=settings.MICROSOFT_CLIENT_ID,
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Microsoft token: {e}",
            )

        email = payload.get("email") or payload.get("preferred_username", "")
        return {
            "email": email,
            "first_name": payload.get("given_name", ""),
            "last_name": payload.get("family_name", ""),
            "sub": payload["sub"],
        }

    async def _find_or_create_user(
        self,
        provider: str,
        provider_user_id: str,
        email: str,
        first_name: str,
        last_name: str,
    ) -> User:
        """Find an existing user by email or create a new one, linking the OAuth provider."""
        email = email.lower()

        user = await self.user_repo.get_by_email(email)

        if user:
            # Check if this provider is already linked
            result = await self.db.execute(
                select(UserOAuthProvider).where(
                    UserOAuthProvider.user_id == user.id,
                    UserOAuthProvider.provider == provider,
                )
            )
            existing_link = result.scalar_one_or_none()

            if not existing_link:
                # Link the new provider to the existing user
                oauth_link = UserOAuthProvider(
                    user_id=user.id,
                    provider=provider,
                    provider_user_id=provider_user_id,
                )
                self.db.add(oauth_link)
                await self.db.commit()

            return user

        # Create a new user (no password for OAuth users)
        user = await self.user_repo.create(
            email=email,
            password_hash=None,
            first_name=first_name,
            last_name=last_name,
        )

        # Create default organization
        org_service = OrganizationService(self.db)
        await org_service.create_organization(
            user_id=user.id,
            name=f"{email}'s Organization",
        )

        # Link the OAuth provider
        oauth_link = UserOAuthProvider(
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_user_id,
        )
        self.db.add(oauth_link)
        await self.db.commit()

        return user

    def _create_token(self, user_id: int) -> str:
        """Create a JWT token with the user's ID as the subject."""
        now = datetime.now(timezone.utc)
        expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
        payload = {"sub": str(user_id), "iat": int(now.timestamp()), "exp": expire}
        return jose_jwt.encode(
            payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
        )
