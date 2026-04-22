"""
In-memory sliding-window rate limiter.

Tracks timestamps per key and rejects when the number of hits within
the configured window exceeds the limit. Good enough for a single-
process deployment — swap for a Redis-backed implementation once the
API runs behind multiple workers.

Usage:
    limiter = RateLimiter(max_hits=3, window_seconds=3600)
    if not limiter.allow("email:user@example.com"):
        raise HTTPException(429, "Too many requests")
"""

import time
from collections import defaultdict, deque
from threading import Lock


class RateLimiter:
    def __init__(self, max_hits: int, window_seconds: int):
        self.max_hits = max_hits
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def allow(self, key: str, now: float | None = None) -> bool:
        """
        Register a hit against `key` and return whether it fits inside
        the window. Also trims expired hits to keep memory bounded.
        """
        current = now if now is not None else time.monotonic()
        cutoff = current - self.window_seconds

        with self._lock:
            bucket = self._hits[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()

            if len(bucket) >= self.max_hits:
                return False

            bucket.append(current)
            return True

    def reset(self, key: str | None = None) -> None:
        """Clear state for a single key, or everything when key is None."""
        with self._lock:
            if key is None:
                self._hits.clear()
            else:
                self._hits.pop(key, None)


# Password-reset limiters:
#   per email  — 3 requests per hour
#   per IP     — 10 requests per hour (higher, so office NATs aren't locked out)
password_reset_email_limiter = RateLimiter(max_hits=3, window_seconds=3600)
password_reset_ip_limiter = RateLimiter(max_hits=10, window_seconds=3600)
