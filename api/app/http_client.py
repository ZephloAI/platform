"""
Shared httpx.AsyncClient singleton.

Why: Creating a new AsyncClient on every outbound HTTP call pays the
TCP + TLS handshake cost each time. By sharing one client across the
whole process, connections to the crawler / agent / OAuth providers
get pooled and reused, which makes requests noticeably faster.

Usage:
    from app.http_client import get_client

    client = get_client()
    await client.post(url, json=..., timeout=10.0)

Lifecycle is managed by FastAPI's lifespan in app/main.py:
    - startup() is called when the API boots
    - shutdown() is called when the API shuts down
"""

import httpx


# Module-level singleton. Created in startup(), closed in shutdown().
_client: httpx.AsyncClient | None = None


# Sensible pooling defaults. Tuned for a handful of internal services.
_LIMITS = httpx.Limits(
    max_connections=100,
    max_keepalive_connections=20,
    keepalive_expiry=30.0,
)

# Default timeout. Callers can override per-request by passing timeout=
# as a kwarg to .get()/.post()/etc.
_DEFAULT_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


async def startup() -> None:
    """Create the shared AsyncClient. Call this from FastAPI lifespan startup."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(limits=_LIMITS, timeout=_DEFAULT_TIMEOUT)


async def shutdown() -> None:
    """Close the shared AsyncClient. Call this from FastAPI lifespan shutdown."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


def get_client() -> httpx.AsyncClient:
    """
    Return the shared AsyncClient.

    Raises RuntimeError if called before startup() — that means the
    FastAPI lifespan hasn't run yet, which shouldn't happen in normal
    request handling.
    """
    if _client is None:
        raise RuntimeError(
            "Shared httpx client is not initialized. "
            "Make sure app.http_client.startup() runs in the FastAPI lifespan."
        )
    return _client
