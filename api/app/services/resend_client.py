"""
Resend client — a minimal async wrapper around the Resend HTTP API.

Only one endpoint is used: POST https://api.resend.com/emails. Callers pass
either a rendered html body or, when a template id is configured, a set of
template variables that Resend will render on its side.

The client is intentionally small so juniors can read it top-to-bottom.
"""

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

RESEND_EMAILS_URL = "https://api.resend.com/emails"


class ResendError(Exception):
    """Raised when Resend returns a non-2xx response or the API key is missing."""


class ResendClient:
    """Send transactional email through Resend."""

    def __init__(
        self,
        api_key: str | None = None,
        from_email: str | None = None,
        timeout: float = 10.0,
    ):
        self.api_key = api_key if api_key is not None else settings.RESEND_API_KEY
        self.from_email = from_email if from_email is not None else settings.RESEND_FROM_EMAIL
        self.timeout = timeout

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
    ) -> dict[str, Any]:
        """
        Send an email.

        If `template_id` is set we pass it to Resend along with `template_data`
        and Resend renders the body. Otherwise we send the raw `html` (and
        optional `text`) body.

        Returns the Resend JSON response (includes the message id).
        """
        if not self.is_configured:
            raise ResendError(
                "RESEND_API_KEY is not set. Configure it before sending email."
            )

        payload: dict[str, Any] = {
            "from": self.from_email,
            "to": [to],
            "subject": subject,
        }

        if template_id:
            payload["template_id"] = template_id
            if template_data:
                payload["template_data"] = template_data
        else:
            if not html and not text:
                raise ResendError("Either html/text body or template_id is required.")
            if html:
                payload["html"] = html
            if text:
                payload["text"] = text

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(RESEND_EMAILS_URL, json=payload, headers=headers)

        if response.status_code >= 400:
            logger.error(
                f"Resend send failed: status={response.status_code} body={response.text}"
            )
            raise ResendError(
                f"Resend responded with {response.status_code}: {response.text}"
            )

        return response.json()


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
