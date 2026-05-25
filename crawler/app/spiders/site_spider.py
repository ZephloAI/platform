"""
Scrapy spider that powers both website discovery and content crawling.

One spider, two modes (chosen with the `mode` argument):

  - mode="discover": start at `start_url`, follow same-domain links, and emit
    {url, title} for every page found. This is the live, streamed discovery.
  - mode="crawl": fetch an explicit list of `urls` (no link following) and emit
    {url, title, content} where content is the clean main text of the page.

Hybrid rendering: pages are fetched over plain HTTP first (fast). If a page comes
back nearly empty -- a sign of a JavaScript/SPA site -- the request is retried once
through a headless browser via scrapy-playwright. Plain sites never pay that cost.

Each emitted page is written to stdout as one JSON line by StdoutWriterPipeline so
the parent process can stream pages as they arrive. Scrapy's own logs go to stderr,
keeping stdout clean.
"""

import json
import sys
from urllib.parse import urlparse

import scrapy
import trafilatura
from scrapy.http import TextResponse
from scrapy.linkextractors import LinkExtractor


class StdoutWriterPipeline:
    """Write each scraped page to stdout as a single JSON line, then flush."""

    def process_item(self, item, spider):
        sys.stdout.write(json.dumps(dict(item)) + "\n")
        sys.stdout.flush()
        return item


class SiteSpider(scrapy.Spider):
    name = "site"

    def __init__(
        self,
        mode: str = "discover",
        start_url: str | None = None,
        urls: str | None = None,
        max_pages: int = 50,
        empty_threshold: int = 200,
        *args,
        **kwargs,
    ):
        """
        Args (all arrive as strings from the command line):
            mode: "discover" or "crawl".
            start_url: where discovery begins (discover mode).
            urls: JSON-encoded list of URLs to fetch (crawl mode).
            max_pages: discovery stops after this many pages.
            empty_threshold: min characters of text before we treat a page as
                "empty" and retry it with a headless browser.
        """
        super().__init__(*args, **kwargs)
        self.mode = mode
        self.start_url = start_url
        self.url_list = json.loads(urls) if urls else []
        self.max_pages = int(max_pages)
        self.empty_threshold = int(empty_threshold)

        # Restrict the crawl to the starting domain (subdomains allowed).
        seed = start_url or (self.url_list[0] if self.url_list else "")
        domain = urlparse(seed).netloc
        self.allowed_domains = [domain] if domain else []
        self.link_extractor = LinkExtractor(allow_domains=self.allowed_domains)

    def start_requests(self):
        if self.mode == "discover":
            if self.start_url:
                yield scrapy.Request(self.start_url, callback=self.parse_discover)
        else:
            for url in self.url_list:
                yield scrapy.Request(url, callback=self.parse_crawl)

    # -- Discovery: emit url + title, then follow same-domain links --

    def parse_discover(self, response):
        if not isinstance(response, TextResponse):
            return  # skip PDFs, images, and other non-HTML responses

        text = self._extract_text(response)
        if self._needs_render(response, text):
            yield self._render_retry(response, self.parse_discover)
            return

        yield {"url": response.url, "title": self._extract_title(response)}

        for link in self.link_extractor.extract_links(response):
            yield scrapy.Request(link.url, callback=self.parse_discover)

    # -- Crawl: emit url + title + clean content for a fixed list of URLs --

    def parse_crawl(self, response):
        if not isinstance(response, TextResponse):
            return

        text = self._extract_text(response)
        if self._needs_render(response, text):
            yield self._render_retry(response, self.parse_crawl)
            return

        yield {
            "url": response.url,
            "title": self._extract_title(response),
            "content": text,
        }

    # -- Helpers --

    def _needs_render(self, response, text: str) -> bool:
        """A near-empty page that wasn't already rendered is likely a JS shell."""
        if response.meta.get("playwright"):
            return False  # already rendered once -- don't loop
        return len(text.strip()) < self.empty_threshold

    def _render_retry(self, response, callback):
        """Re-request the same URL through a headless browser."""
        return scrapy.Request(
            response.url,
            callback=callback,
            meta={"playwright": True},
            dont_filter=True,
        )

    def _extract_text(self, response) -> str:
        """Extract the clean main text of the page with trafilatura."""
        try:
            return trafilatura.extract(response.text) or ""
        except Exception:
            return ""

    def _extract_title(self, response) -> str:
        title = response.css("title::text").get()
        return (title or response.url).strip()
