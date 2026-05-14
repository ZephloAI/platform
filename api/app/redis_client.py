"""
Redis client singleton.

Provides a single async Redis connection used for short-lived caching of
hot public endpoints (e.g. widget config). Intentionally minimal so that
junior developers can pick it up quickly.

Usage:
    from app.redis_client import get_redis

    client = get_redis()
    if client:
        value = await client.get("some_key")

If Redis is unavailable, callers should treat cache operations as a
best-effort optimization and fall back to the source of truth (DB).
"""

import logging

from redis.asyncio import Redis

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level singleton. Created in startup(), closed in shutdown().
_redis_client: Redis | None = None


def get_redis() -> Redis | None:
    """Return the shared Redis client, or None if not initialized."""
    return _redis_client


async def startup() -> None:
    """
    Initialize the Redis client and verify connectivity.

    Called from the FastAPI lifespan. We don't crash the app if Redis is
    unreachable — caching is best-effort, and the app must still serve
    traffic from Postgres if Redis is down.
    """
    global _redis_client
    try:
        _redis_client = Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
        )
        # Cheap ping to verify the connection is healthy at boot.
        await _redis_client.ping()
        logger.info(f"Redis connected at {settings.REDIS_URL}")
    except Exception as e:
        logger.warning(f"Redis unavailable at startup: {e}. Caching disabled.")
        _redis_client = None


async def shutdown() -> None:
    """Close the Redis client cleanly on app shutdown."""
    global _redis_client
    if _redis_client is not None:
        try:
            await _redis_client.aclose()
        except Exception as e:
            logger.warning(f"Error closing Redis client: {e}")
        _redis_client = None
