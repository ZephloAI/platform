"""
Core website crawling logic using Crawl4AI.

Crawls a website starting from a given URL, follows internal links
(same domain only), and extracts clean text content from each page.

Where possible, pages are fetched in parallel batches for speed.
"""

import asyncio
from urllib.parse import urlparse, urljoin

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig

# How many pages to fetch at once in parallel batches
PARALLEL_BATCH_SIZE = 5


def _extract_title(result, fallback_url: str) -> str:
    """Pull the page title from crawl result metadata, or fall back to URL."""
    if result.metadata and isinstance(result.metadata, dict):
        return result.metadata.get("title") or fallback_url
    return fallback_url


def _extract_content(result) -> str:
    """Pull clean markdown text from a crawl result."""
    if result.markdown_v2:
        return result.markdown_v2.raw_markdown or ""
    if result.markdown:
        return result.markdown
    return ""


def _strip_fragment(url: str) -> str:
    """Remove the #fragment from a URL so /contact and /contact#form are the same page."""
    return url.split("#")[0]


def _extract_internal_links(result, base_url: str, domain: str, visited: set) -> list[str]:
    """Extract same-domain links from a crawl result that we haven't visited."""
    new_urls = []
    if result.links and isinstance(result.links, dict):
        for link in result.links.get("internal", []):
            href = link.get("href", "")
            if not href:
                continue
            full_url = _strip_fragment(urljoin(base_url, href))
            if full_url and urlparse(full_url).netloc == domain and full_url not in visited:
                new_urls.append(full_url)
    return new_urls


async def crawl_website(website_url: str, max_pages: int = 50) -> list[dict]:
    """
    Crawl a website starting from the given URL.

    Visits pages on the same domain, extracts text content, and returns
    a list of page dicts with url, title, and content fields.

    Pages are fetched in parallel batches of PARALLEL_BATCH_SIZE for speed,
    while still discovering new links from each batch before moving on.
    """
    visited: set[str] = set()
    pages: list[dict] = []
    domain = urlparse(website_url).netloc
    to_visit = [website_url]

    browser_config = BrowserConfig(headless=True)
    crawl_config = CrawlerRunConfig()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        while to_visit and len(pages) < max_pages:
            # Grab the next batch of URLs to fetch in parallel
            batch: list[str] = []
            while to_visit and len(batch) < PARALLEL_BATCH_SIZE and (len(pages) + len(batch)) < max_pages:
                url = to_visit.pop(0)
                if url not in visited:
                    visited.add(url)
                    batch.append(url)

            if not batch:
                break

            # Fetch all URLs in this batch concurrently
            tasks = [crawler.arun(url=url, config=crawl_config) for url in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for url, result in zip(batch, results):
                if isinstance(result, Exception):
                    print(f"Error crawling {url}: {result}")
                    continue

                if not result.success:
                    continue

                pages.append({
                    "url": url,
                    "title": _extract_title(result, url),
                    "content": _extract_content(result),
                })

                # Discover new links for future batches
                for new_url in _extract_internal_links(result, url, domain, visited):
                    to_visit.append(new_url)

    return pages


async def discover_urls(website_url: str, max_pages: int = 50) -> list[dict]:
    """
    Discover all reachable URLs on a website without processing content.

    Spiders the site in parallel batches, following internal links and
    collecting the URL + page title for each page. Lighter than
    crawl_website() because we skip heavy content extraction.
    """
    visited: set[str] = set()
    discovered: list[dict] = []
    domain = urlparse(website_url).netloc
    to_visit = [website_url]

    browser_config = BrowserConfig(headless=True)
    crawl_config = CrawlerRunConfig()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        while to_visit and len(discovered) < max_pages:
            # Grab the next batch
            batch: list[str] = []
            while to_visit and len(batch) < PARALLEL_BATCH_SIZE and (len(discovered) + len(batch)) < max_pages:
                url = to_visit.pop(0)
                if url not in visited:
                    visited.add(url)
                    batch.append(url)

            if not batch:
                break

            # Fetch batch concurrently
            tasks = [crawler.arun(url=url, config=crawl_config) for url in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for url, result in zip(batch, results):
                if isinstance(result, Exception):
                    print(f"Error discovering {url}: {result}")
                    continue

                if not result.success:
                    continue

                discovered.append({
                    "url": url,
                    "title": _extract_title(result, url),
                })

                for new_url in _extract_internal_links(result, url, domain, visited):
                    to_visit.append(new_url)

    return discovered


async def crawl_selected_urls(urls: list[str]) -> list[dict]:
    """
    Crawl a specific list of URLs and extract their content.

    Unlike crawl_website(), this does NOT follow links -- it only fetches
    the exact URLs provided. All URLs are fetched in parallel batches
    for maximum speed.
    """
    pages: list[dict] = []

    browser_config = BrowserConfig(headless=True)
    crawl_config = CrawlerRunConfig()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # Process in parallel batches
        for i in range(0, len(urls), PARALLEL_BATCH_SIZE):
            batch = urls[i : i + PARALLEL_BATCH_SIZE]

            tasks = [crawler.arun(url=url, config=crawl_config) for url in batch]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for url, result in zip(batch, results):
                if isinstance(result, Exception):
                    print(f"Error crawling {url}: {result}")
                    continue

                if not result.success:
                    print(f"Failed to crawl {url}, skipping")
                    continue

                pages.append({
                    "url": url,
                    "title": _extract_title(result, url),
                    "content": _extract_content(result),
                })

    return pages
