"""
Resend client — a thin async wrapper around the official `resend` Python SDK.

The SDK is synchronous, so every call is dispatched through `asyncio.to_thread`
to avoid blocking the FastAPI event loop. Only one operation is exposed:
sending a transactional email, optionally rendered from a Resend-hosted
template.

Kept short so juniors can read it top-to-bottom.
"""

import asyncio
import logging
from typing import Any

import resend

from app.config import settings

logger = logging.getLogger(__name__)


class ResendError(Exception):
    """Raised when the SDK call fails or the API key is missing."""


class ResendClient:
    """Send transactional email through Resend."""

    def __init__(
        self,
        api_key: str | None = None,
        from_email: str | None = None,
    ):
        self.api_key = api_key if api_key is not None else settings.RESEND_API_KEY
        self.from_email = from_email if from_email is not None else settings.RESEND_FROM_EMAIL

    @property
    def is_configured(self) -> bool:
        """True if we have an API key. Lets callers skip sending in dev/tests."""
        return bool(self.api_key)

    async def send_email(
        self,
        to: str,
        subject: str,
        html: str | None = None,
        text: str | None = None,
        template_id: str | None = None,
        template_data: dict[str, Any] | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        """
        Send an email.

        If `template_id` is set, Resend renders the body server-side using the
        hosted template. Otherwise we send the raw `html` (and optional `text`)
        body. `template_data` and `html`/`text` are mutually exclusive — Resend
        rejects payloads that mix them.

        Returns the SDK response (dict-like, includes "id").
        """
        if not self.is_configured:
            raise ResendError(
                "RESEND_API_KEY is not set. Configure it before sending email."
            )

        params: dict[str, Any] = {
            "from": self.from_email,
            "to": [to],
            "subject": subject,
        }

        if template_id:
            params["template"] = {"id": template_id}
            if template_data:
                params["template"]["variables"] = template_data
        else:
            if not html and not text:
                raise ResendError("Either html/text body or template_id is required.")
            if html:
                params["html"] = html
            if text:
                params["text"] = text

        options: dict[str, Any] | None = None
        if idempotency_key:
            options = {"idempotency_key": idempotency_key}

        # The SDK reads its API key from the module-level attribute. Set it on
        # every call so per-instance keys (used in tests) take effect.
        resend.api_key = self.api_key

        try:
            if options is not None:
                response = await asyncio.to_thread(
                    resend.Emails.send, params, options
                )
            else:
                response = await asyncio.to_thread(resend.Emails.send, params)
        except Exception as exc:
            logger.error(f"Resend send failed: {exc}")
            raise ResendError(str(exc)) from exc

        return response


def fallback_invite_html(
    organization_name: str,
    inviter_email: str,
    accept_url: str,
    role: str,
) -> str:
    """
    Plain-HTML fallback used when RESEND_INVITE_TEMPLATE_ID is not configured.

    Kept short and inline-styled so email clients render it predictably.
    """
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1d1d1f;">
      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px;">
        You've been invited to {organization_name}
      </h1>
      <p style="font-size: 15px; line-height: 1.5; margin: 0 0 12px;">
        {inviter_email} invited you to join <strong>{organization_name}</strong> as a {role} on the Flunkie Agent platform.
      </p>
      <p style="margin: 24px 0;">
        <a href="{accept_url}" style="display: inline-block; background: #0071e3; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Accept invitation
        </a>
      </p>
      <p style="font-size: 13px; color: #6e6e73; line-height: 1.5; margin: 0;">
        If the button doesn't work, copy and paste this link into your browser:<br />
        <a href="{accept_url}" style="color: #0071e3; word-break: break-all;">{accept_url}</a>
      </p>
      <p style="font-size: 12px; color: #a1a1a6; margin-top: 32px;">
        If you weren't expecting this invitation, you can safely ignore this email.
      </p>
    </div>
    """.strip()


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: str | None = None,
) -> None:
    """
    Send a transactional email via Resend (module-level convenience wrapper).

    Falls back to logging the payload when RESEND_API_KEY is unset so
    developers don't need Resend credentials to exercise the flow. Raises
    ResendError if Resend rejects the request.
    """
    client = ResendClient()
    if not client.is_configured:
        logger.warning(
            f"RESEND_API_KEY not set — skipping send. to={to} subject={subject!r}"
        )
        logger.info(f"Email body (html): {html}")
        return

    await client.send_email(to=to, subject=subject, html=html, text=text)
