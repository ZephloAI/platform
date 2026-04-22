"""
Unit tests for the in-memory rate limiter used by the password-reset
endpoints.

We inject a synthetic clock (the `now` argument) so we don't have to
sleep in tests — these should run in milliseconds.
"""

from app.services.rate_limiter import RateLimiter


def test_allows_up_to_max_hits_then_blocks():
    limiter = RateLimiter(max_hits=3, window_seconds=60)
    assert limiter.allow("alice", now=0.0) is True
    assert limiter.allow("alice", now=1.0) is True
    assert limiter.allow("alice", now=2.0) is True
    # 4th hit within the window is rejected
    assert limiter.allow("alice", now=3.0) is False


def test_separate_keys_have_separate_budgets():
    limiter = RateLimiter(max_hits=1, window_seconds=60)
    assert limiter.allow("alice", now=0.0) is True
    # Bob starts fresh even though Alice is exhausted.
    assert limiter.allow("bob", now=0.0) is True
    assert limiter.allow("alice", now=1.0) is False
    assert limiter.allow("bob", now=1.0) is False


def test_window_slides_forward():
    limiter = RateLimiter(max_hits=2, window_seconds=60)
    assert limiter.allow("alice", now=0.0) is True
    assert limiter.allow("alice", now=30.0) is True
    assert limiter.allow("alice", now=59.0) is False
    # 61 seconds later the first hit has expired, so we can hit again.
    assert limiter.allow("alice", now=61.0) is True


def test_reset_clears_single_key():
    limiter = RateLimiter(max_hits=1, window_seconds=60)
    assert limiter.allow("alice", now=0.0) is True
    assert limiter.allow("alice", now=1.0) is False
    limiter.reset("alice")
    assert limiter.allow("alice", now=2.0) is True


def test_reset_all_clears_everything():
    limiter = RateLimiter(max_hits=1, window_seconds=60)
    assert limiter.allow("alice", now=0.0) is True
    assert limiter.allow("bob", now=0.0) is True
    limiter.reset()
    assert limiter.allow("alice", now=1.0) is True
    assert limiter.allow("bob", now=1.0) is True
