"""
Resend email client.

Thin wrapper around the Resend HTTP API for sending transactional
emails. Shared by features that need to send email (password reset,
invitations, etc.).

Configuration is read from the process environment via app.config.
If no API key is configured the client logs the outgoing email and
returns — useful for local development without Resend credentials.
"""

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
) -> None:
    """
    Send a transactional email via Resend.

    Falls back to logging the payload when RESEND_API_KEY is unset
    so developers don't need Resend credentials to exercise the flow.

    Raises httpx.HTTPStatusError if Resend rejects the request.
    """
    api_key = settings.RESEND_API_KEY
    from_address = settings.RESEND_FROM_EMAIL

    if not api_key:
        logger.warning(
            f"RESEND_API_KEY not set — skipping send. to={to} subject={subject!r}"
        )
        logger.info(f"Email body (html): {html}")
        return

    payload = {
        "from": from_address,
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(RESEND_API_URL, json=payload, headers=headers)
        response.raise_for_status()
