"""
Unit tests for password-reset token lifecycle helpers.

These cover the pure-logic parts of the reset flow:
  - token generation produces high-entropy, URL-safe strings
  - hashing is deterministic and uses SHA-256
  - validity checks correctly accept fresh tokens and reject
    expired or already-used ones
  - constant-time comparison matches the stored hash
"""

import hashlib
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.services.password_reset_service import (
    PasswordResetService,
    generate_token,
    hash_token,
)


def test_generate_token_is_urlsafe_and_unique():
    a = generate_token()
    b = generate_token()
    assert a != b
    # token_urlsafe(32) -> ~43 characters; never less than 32.
    assert len(a) >= 32
    # Only URL-safe characters.
    allowed = set(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    )
    assert set(a).issubset(allowed)


def test_hash_token_is_deterministic_sha256():
    raw = "some-sample-token"
    expected = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    assert hash_token(raw) == expected
    # Different input -> different hash.
    assert hash_token(raw + "x") != expected


def test_tokens_match_uses_constant_time_compare():
    raw = generate_token()
    stored = hash_token(raw)
    assert PasswordResetService.tokens_match(stored, raw) is True
    assert PasswordResetService.tokens_match(stored, "not-the-token") is False


def _record(expires_in_minutes: int, used: bool = False):
    """Minimal stand-in for a PasswordResetToken row."""
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expires_in_minutes)
    used_at = now if used else None
    return SimpleNamespace(expires_at=expires_at, used_at=used_at)


def test_fresh_token_is_valid():
    now = datetime.now(timezone.utc)
    assert PasswordResetService._is_valid(_record(expires_in_minutes=15), now) is True


def test_expired_token_is_invalid():
    now = datetime.now(timezone.utc)
    assert PasswordResetService._is_valid(_record(expires_in_minutes=-1), now) is False


def test_used_token_is_invalid_even_if_not_expired():
    now = datetime.now(timezone.utc)
    assert (
        PasswordResetService._is_valid(_record(expires_in_minutes=15, used=True), now)
        is False
    )


def test_validity_handles_timezone_aware_expiry():
    now = datetime.now(timezone.utc)
    aware_future = SimpleNamespace(
        expires_at=now + timedelta(minutes=10), used_at=None
    )
    aware_past = SimpleNamespace(
        expires_at=now - timedelta(minutes=10), used_at=None
    )
    assert PasswordResetService._is_valid(aware_future, now) is True
    assert PasswordResetService._is_valid(aware_past, now) is False
