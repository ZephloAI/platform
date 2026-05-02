"""
Unit tests for the Resend client wrapper.

These tests monkeypatch `resend.Emails.send` so nothing real is sent. They
cover:

- Missing API key raises ResendError before any SDK call
- Template id path passes the correct nested template payload
- HTML body path sends html instead of a template
- Non-2xx / SDK exceptions surface as ResendError
- Idempotency key flows through as the second positional argument
"""

import pytest
import resend

from app.services.resend_client import (
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
async def test_send_email_with_template_id_sends_nested_template_payload(monkeypatch):
    client = ResendClient(api_key="rk_test", from_email="test@example.com")
    captured: dict = {}

    def fake_send(params, options=None):
        captured["params"] = params
        captured["options"] = options
        return {"id": "msg_abc"}

    monkeypatch.setattr(resend.Emails, "send", fake_send)

    result = await client.send_email(
        to="invitee@example.com",
        subject="You're invited",
        template_id="tmpl_invite_123",
        template_data={"ORG": "Acme", "ACCEPT_URL": "https://x.example/t"},
    )

    assert result == {"id": "msg_abc"}
    assert resend.api_key == "rk_test"

    params = captured["params"]
    assert params["from"] == "test@example.com"
    assert params["to"] == ["invitee@example.com"]
    assert params["template"] == {
        "id": "tmpl_invite_123",
        "variables": {"ORG": "Acme", "ACCEPT_URL": "https://x.example/t"},
    }
    # Template + html are mutually exclusive — html must not leak in.
    assert "html" not in params
    assert captured["options"] is None


@pytest.mark.asyncio
async def test_send_email_with_html_body_when_no_template(monkeypatch):
    client = ResendClient(api_key="rk_test", from_email="test@example.com")
    captured: dict = {}

    def fake_send(params, options=None):
        captured["params"] = params
        return {"id": "msg_html"}

    monkeypatch.setattr(resend.Emails, "send", fake_send)

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
    assert "Acme" in captured["params"]["html"]
    assert "https://example.com/accept/tok" in captured["params"]["html"]
    assert "template" not in captured["params"]


@pytest.mark.asyncio
async def test_send_email_no_body_and_no_template_raises():
    client = ResendClient(api_key="rk_test", from_email="test@example.com")
    with pytest.raises(ResendError):
        await client.send_email(to="a@b.com", subject="hi")


@pytest.mark.asyncio
async def test_send_email_sdk_exception_becomes_resend_error(monkeypatch):
    client = ResendClient(api_key="rk_test", from_email="test@example.com")

    def fake_send(params, options=None):
        raise RuntimeError("422 invalid recipient")

    monkeypatch.setattr(resend.Emails, "send", fake_send)

    with pytest.raises(ResendError):
        await client.send_email(to="a@b.com", subject="hi", html="<p>hi</p>")


@pytest.mark.asyncio
async def test_send_email_idempotency_key_passed_as_options(monkeypatch):
    client = ResendClient(api_key="rk_test", from_email="test@example.com")
    captured: dict = {}

    def fake_send(params, options=None):
        captured["options"] = options
        return {"id": "msg_xyz"}

    monkeypatch.setattr(resend.Emails, "send", fake_send)

    await client.send_email(
        to="a@b.com",
        subject="hi",
        html="<p>hi</p>",
        idempotency_key="invite/42/1",
    )

    assert captured["options"] == {"idempotency_key": "invite/42/1"}


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
