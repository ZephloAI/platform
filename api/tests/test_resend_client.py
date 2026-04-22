"""
Unit tests for the Resend client wrapper.

These tests use `respx` to intercept the outbound Resend HTTP call so nothing
real is sent. They cover:

- Missing API key raises ResendError before any HTTP call
- Template id path sends the expected payload
- Fallback HTML path sends html instead of a template
- Non-2xx responses surface as ResendError
"""

import httpx
import pytest
import respx

from app.services.resend_client import (
    RESEND_EMAILS_URL,
    ResendClient,
    ResendError,
    fallback_invite_html,
)


@pytest.mark.asyncio
async def test_send_email_without_api_key_raises():
    client = ResendClient(api_key="", from_email="test@example.com")
    with pytest.raises(ResendError):
        await client.send_email(to="a@b.com", subject="hi", html="<p>hi</p>")


@pytest.mark.asyncio
async def test_send_email_with_template_id_sends_template_payload():
    client = ResendClient(api_key="rk_test", from_email="test@example.com")

    with respx.mock:
        route = respx.post(RESEND_EMAILS_URL).mock(
            return_value=httpx.Response(200, json={"id": "msg_abc"})
        )

        result = await client.send_email(
            to="invitee@example.com",
            subject="You're invited",
            template_id="tmpl_invite_123",
            template_data={"org": "Acme", "accept_url": "https://x.example/t"},
        )

        assert result == {"id": "msg_abc"}
        assert route.called
        sent = route.calls[0].request
        assert sent.headers["authorization"] == "Bearer rk_test"
        import json

        body = json.loads(sent.content.decode())
        assert body["template_id"] == "tmpl_invite_123"
        assert body["template_data"]["accept_url"] == "https://x.example/t"
        # When a template is used, no raw html body should be sent.
        assert "html" not in body


@pytest.mark.asyncio
async def test_send_email_with_html_body_when_no_template():
    client = ResendClient(api_key="rk_test", from_email="test@example.com")

    with respx.mock:
        route = respx.post(RESEND_EMAILS_URL).mock(
            return_value=httpx.Response(200, json={"id": "msg_html"})
        )

        html = fallback_invite_html(
            organization_name="Acme",
            inviter_email="owner@example.com",
            accept_url="https://example.com/accept/tok",
            role="member",
        )
        result = await client.send_email(
            to="invitee@example.com",
            subject="You're invited",
            html=html,
        )

        assert result == {"id": "msg_html"}
        assert route.called
        body = route.calls[0].request.content.decode()
        assert '"html"' in body
        assert "Acme" in body
        assert "https://example.com/accept/tok" in body


@pytest.mark.asyncio
async def test_send_email_no_body_and_no_template_raises():
    client = ResendClient(api_key="rk_test", from_email="test@example.com")
    with pytest.raises(ResendError):
        await client.send_email(to="a@b.com", subject="hi")


@pytest.mark.asyncio
async def test_send_email_non_2xx_raises():
    client = ResendClient(api_key="rk_test", from_email="test@example.com")

    with respx.mock:
        respx.post(RESEND_EMAILS_URL).mock(
            return_value=httpx.Response(422, json={"message": "bad email"})
        )

        with pytest.raises(ResendError):
            await client.send_email(to="a@b.com", subject="hi", html="<p>hi</p>")


def test_fallback_invite_html_contains_key_fields():
    html = fallback_invite_html(
        organization_name="Widgets Inc",
        inviter_email="boss@widgets.test",
        accept_url="https://app.example/accept/abc123",
        role="admin",
    )
    assert "Widgets Inc" in html
    assert "boss@widgets.test" in html
    assert "https://app.example/accept/abc123" in html
    assert "admin" in html
