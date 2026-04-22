"""
Usage client — talks to the api service's internal endpoints.

The api owns all limit + usage state. The agent service calls:

- ``precheck(chatbot_id)`` before running the LLM. If the org is over its
  token budget or suspended, we abort with the returned structured code
  so the frontend can surface a clear error.
- ``record(...)`` after a successful run. Writes a per-call row AND bumps
  the cheap per-org counter the admin dashboard reads.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class PrecheckResult:
    ok: bool
    code: str | None = None
    message: str | None = None
    limit: int | None = None

    @property
    def is_blocked(self) -> bool:
        return not self.ok


class BudgetExceededError(RuntimeError):
    """Raised when the pre-flight usage check rejects the call."""

    def __init__(self, code: str, message: str, limit: int | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.limit = limit


async def precheck_usage(chatbot_id: int) -> PrecheckResult:
    """Call the api's usage precheck endpoint. Fails open on network errors
    so a flaky api doesn't take every chat down."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.API_CALLBACK_URL}/api/internal/usage/precheck",
                json={"chatbot_id": chatbot_id},
            )
            resp.raise_for_status()
            data = resp.json()
            return PrecheckResult(
                ok=bool(data.get("ok", True)),
                code=data.get("code"),
                message=data.get("message"),
                limit=data.get("limit"),
            )
    except Exception:
        logger.warning("Usage precheck failed, allowing the call to proceed", exc_info=True)
        return PrecheckResult(ok=True)


async def record_usage(
    *,
    chatbot_id: int,
    session_id: str | None,
    model: str | None,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
) -> None:
    """Best-effort: post usage to api. Never raises — usage accounting
    should not break the chat response."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{settings.API_CALLBACK_URL}/api/internal/usage/record",
                json={
                    "chatbot_id": chatbot_id,
                    "session_id": session_id,
                    "model": model,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens,
                },
            )
    except Exception:
        logger.warning("Failed to record token usage for chatbot %s", chatbot_id)


def extract_token_counts(response) -> tuple[int, int, int]:
    """Best-effort pull of token counts from an Agno run response.

    Agno surfaces usage via ``response.metrics`` or per-message ``metrics``.
    Shape varies by provider — we sum whatever we find and fall back to 0.
    Returns (prompt, completion, total).
    """
    prompt = 0
    completion = 0
    total = 0

    def _add(metrics) -> None:
        nonlocal prompt, completion, total
        if metrics is None:
            return
        # Metrics may be a pydantic model, dataclass, or dict.
        get = metrics.get if isinstance(metrics, dict) else lambda k, d=None: getattr(metrics, k, d)
        prompt += int(get("input_tokens", 0) or 0)
        completion += int(get("output_tokens", 0) or 0)
        total += int(get("total_tokens", 0) or 0)

    try:
        _add(getattr(response, "metrics", None))
        messages = getattr(response, "messages", None) or []
        for msg in messages:
            _add(getattr(msg, "metrics", None))
    except Exception:
        logger.debug("Could not extract token counts from response", exc_info=True)

    if total == 0 and (prompt or completion):
        total = prompt + completion
    return prompt, completion, total
