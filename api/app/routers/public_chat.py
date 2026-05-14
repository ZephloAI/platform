"""
Public chat router - widget configuration endpoint.

The embeddable widget fetches its config (name, icon, welcome message, etc.)
from the GET endpoint here.

Supports optional X-API-Key header for authenticated access.
If a key is provided, it must be valid and match the chatbot_id.
If no key is provided, the endpoint works without auth (backward compat).

This endpoint is on the hot path — every widget page-load hits it. We cache
successful responses in Redis for a short TTL so we can absorb traffic spikes
without hammering Postgres. Cache failures are non-fatal: we always fall back
to the database.
"""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import validate_api_key
from app.redis_client import get_redis
from app.schemas.chatbot import PublicWidgetConfig
from app.repositories.chatbot_repository import ChatbotRepository

router = APIRouter(prefix="/api/public", tags=["public-chat"])

logger = logging.getLogger(__name__)

# Short TTL — agent config rarely changes, and a 30s staleness window is fine.
WIDGET_CONFIG_CACHE_TTL_SECONDS = 30


def _widget_config_cache_key(agent_id: str) -> str:
    """Build the Redis cache key for a given agent's public widget config."""
    return f"widget_config:{agent_id}"


@router.get("/agents/{agent_id}/config", response_model=PublicWidgetConfig)
async def get_widget_config(
    agent_id: str,
    db: AsyncSession = Depends(get_db),
    api_key=Depends(validate_api_key),
):
    """
    Public endpoint returning widget configuration.

    Accepts an optional X-API-Key header. If provided, the key must be
    valid and belong to the requested chatbot. If absent, access is allowed
    without authentication (backward compatible).
    """
    cache_key = _widget_config_cache_key(agent_id)
    redis = get_redis()

    # --- Cache read (best-effort) -----------------------------------------
    # The response body doesn't depend on the API key — the key only gates
    # access. If a key is provided we still run the auth check below before
    # returning, but the cached JSON itself is safe to share across callers.
    if redis is not None:
        try:
            cached = await redis.get(cache_key)
            if cached is not None:
                # We still need to honor api_key validation, so we have to
                # fetch the chatbot to compare org/chatbot ids when a key
                # was supplied. When no key was supplied, return the cached
                # payload directly — this is the hot path for anonymous
                # widget loads on customer sites.
                if api_key is None:
                    return PublicWidgetConfig(**json.loads(cached))
        except Exception as e:
            logger.warning(f"Redis GET failed for {cache_key}: {e}")

    chatbot_repo = ChatbotRepository(db)
    chatbot = await chatbot_repo.get_by_public_id(agent_id)

    # If an API key was provided, verify it belongs to the same organization
    if api_key and chatbot:
        if api_key.organization_id and chatbot.organization_id:
            if api_key.organization_id != chatbot.organization_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="API key does not match this chatbot's organization",
                )
        elif api_key.chatbot_id and api_key.chatbot_id != chatbot.id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key does not match this chatbot",
            )

    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    response = PublicWidgetConfig(
        chatbot_id=chatbot.public_id,
        name=chatbot.name,
        is_active=chatbot.is_active if chatbot.is_active is not None else True,
        widget_icon=chatbot.widget_icon,
        widget_welcome=chatbot.widget_welcome,
        widget_position=chatbot.widget_position,
        quick_prompts=chatbot.quick_prompts or [],
        follow_up_prompts=chatbot.follow_up_prompts or [],
        greeting_prompts=chatbot.greeting_prompts or [],
        greeting_prompt_duration=chatbot.greeting_prompt_duration,
        widget_logo_url=chatbot.widget_logo_url,
        widget_width=chatbot.widget_width,
        widget_height=chatbot.widget_height,
        widget_font_family=chatbot.widget_font_family,
        widget_font_size=chatbot.widget_font_size,
        voice_enabled=chatbot.voice_enabled or False,
        webmcp_enabled=chatbot.webmcp_enabled or False,
    )

    # --- Cache write (best-effort) ----------------------------------------
    # Only the 200 path reaches here — 401/404 raised above and never cached.
    if redis is not None:
        try:
            await redis.setex(
                cache_key,
                WIDGET_CONFIG_CACHE_TTL_SECONDS,
                response.model_dump_json(),
            )
        except Exception as e:
            logger.warning(f"Redis SETEX failed for {cache_key}: {e}")

    return response
