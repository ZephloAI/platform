"""
Run the Scrapy spider in a subprocess and stream its results.

The spider (app/run_spider.py) writes one JSON line per page to stdout. These
helpers spawn that subprocess and yield each page as it arrives, so callers can
stream pages live instead of waiting for the whole crawl to finish.

  - stream_discovery(start_url, max_pages): yields {url, title} per page found.
  - stream_crawl(urls):                     yields {url, title, content} per page.
"""

import asyncio
import json
import sys
from collections import deque
from typing import AsyncIterator


async def _drain_stderr(stream, sink: deque) -> None:
    """Continuously read stderr so its pipe never fills and blocks the spider."""
    async for line in stream:
        sink.append(line.decode(errors="replace"))


# A single page's content is one JSON line, which can be large. Raise the stream
# reader limit well above the 64KB default so big pages don't overflow it.
_STREAM_LIMIT = 16 * 1024 * 1024  # 16 MB per line


async def _stream_spider(args: list[str]) -> AsyncIterator[dict]:
    """Spawn `python -m app.run_spider <args>` and yield each JSON line of stdout."""
    proc = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "app.run_spider",
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        limit=_STREAM_LIMIT,
    )

    # Drain stderr in the background to avoid a deadlock if it fills up.
    stderr_tail: deque = deque(maxlen=50)
    drainer = asyncio.create_task(_drain_stderr(proc.stderr, stderr_tail))

    try:
        async for raw in proc.stdout:
            line = raw.decode(errors="replace").strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue  # ignore any stray non-JSON line
    finally:
        await proc.wait()
        await drainer

    if proc.returncode != 0:
        raise RuntimeError(
            f"Spider exited with code {proc.returncode}: {''.join(stderr_tail)[-1000:]}"
        )


async def stream_discovery(start_url: str, max_pages: int = 50) -> AsyncIterator[dict]:
    """Yield {url, title} for each page discovered on the site."""
    async for page in _stream_spider(
        ["--mode", "discover", "--start-url", start_url, "--max-pages", str(max_pages)]
    ):
        yield page


async def stream_crawl(urls: list[str]) -> AsyncIterator[dict]:
    """Yield {url, title, content} for each URL fetched."""
    async for page in _stream_spider(["--mode", "crawl", "--urls", json.dumps(urls)]):
        yield page
