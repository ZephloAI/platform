"""
Subprocess entry point for running the Scrapy spider.

We run Scrapy in its own process (rather than inside the FastAPI app) because
Scrapy's Twisted reactor cannot be restarted within a single process. A fresh
subprocess per crawl sidesteps that entirely and fully isolates each job.

Usage (called by app/scrapy_runner.py):
    python -m app.run_spider --mode discover --start-url https://site --max-pages 50
    python -m app.run_spider --mode crawl --urls '["https://site/a", ...]'

Scraped pages are written to stdout as JSON lines (see StdoutWriterPipeline);
Scrapy's logs go to stderr, so the parent can read clean page data from stdout.
"""

import argparse

from scrapy.crawler import CrawlerProcess

from app.config import settings
from app.spiders.site_spider import SiteSpider


def build_settings(max_pages: int, is_discover: bool) -> dict:
    """Scrapy settings tuned for speed, with a headless-browser fallback."""
    s = {
        # Use the asyncio reactor so scrapy-playwright can drive the browser.
        "TWISTED_REACTOR": "twisted.internet.asyncioreactor.AsyncioSelectorReactor",
        # Plain HTTP by default; Playwright only for requests tagged playwright=True.
        "DOWNLOAD_HANDLERS": {
            "http": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
            "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
        },
        "PLAYWRIGHT_BROWSER_TYPE": "chromium",
        "PLAYWRIGHT_LAUNCH_OPTIONS": {"headless": True},
        # Render with the same browser User-Agent as plain fetches; the default
        # headless Chromium UA ("HeadlessChrome") is also blocked by some sites.
        "PLAYWRIGHT_CONTEXTS": {"default": {"user_agent": settings.USER_AGENT}},
        # Look like a real browser so sites/WAFs don't block us (the #1 cause of
        # discovery and crawling silently returning nothing).
        "USER_AGENT": settings.USER_AGENT,
        "DEFAULT_REQUEST_HEADERS": {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
        # Let 4xx/5xx responses reach the spider so we can report the real reason
        # (e.g. "returned HTTP 403") instead of dropping them and looking empty.
        "HTTPERROR_ALLOW_ALL": True,
        # Speed: many requests in flight. We crawl the customer's own site, so we
        # skip the politeness throttle and robots.txt to fetch every page quickly.
        "CONCURRENT_REQUESTS": settings.CONCURRENT_REQUESTS,
        "CONCURRENT_REQUESTS_PER_DOMAIN": settings.CONCURRENT_REQUESTS_PER_DOMAIN,
        "AUTOTHROTTLE_ENABLED": False,
        "DNSCACHE_ENABLED": True,
        "ROBOTSTXT_OBEY": False,
        "COOKIES_ENABLED": False,
        # Reliability: retry transient failures so pages stop getting dropped.
        "RETRY_ENABLED": True,
        "RETRY_TIMES": 2,
        "DOWNLOAD_TIMEOUT": 45,
        # Keep stdout clean: only items go there, logs go to stderr.
        "LOG_LEVEL": "ERROR",
        "TELNETCONSOLE_ENABLED": False,
        "ITEM_PIPELINES": {
            "app.spiders.site_spider.StdoutWriterPipeline": 100,
        },
    }
    # Bound discovery by number of pages found (items emitted, not requests made).
    if is_discover:
        s["CLOSESPIDER_ITEMCOUNT"] = max_pages
    return s


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", required=True, choices=["discover", "crawl"])
    parser.add_argument("--start-url")
    parser.add_argument("--urls", help="JSON-encoded list of URLs (crawl mode)")
    parser.add_argument("--max-pages", type=int, default=settings.MAX_PAGES)
    args = parser.parse_args()

    process = CrawlerProcess(settings=build_settings(args.max_pages, args.mode == "discover"))
    process.crawl(
        SiteSpider,
        mode=args.mode,
        start_url=args.start_url,
        urls=args.urls,
        max_pages=args.max_pages,
        empty_threshold=settings.EMPTY_CONTENT_THRESHOLD,
    )
    process.start()  # blocks until the crawl finishes


if __name__ == "__main__":
    main()
