"""
Core website crawling logic using Crawl4AI.

Crawls a website starting from a given URL, follows internal links
(same domain only), and extracts clean text content from each page.
"""

from urllib.parse import urlparse, urljoin

from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig


async def crawl_website(website_url: str, max_pages: int = 50) -> list[dict]:
    """
    Crawl a website starting from the given URL.

    Visits pages on the same domain, extracts text content, and returns
    a list of page dicts with url, title, and content fields.

    Args:
        website_url: The starting URL to crawl.
        max_pages: Maximum number of pages to crawl.

    Returns:
        List of dicts, each with keys: url, title, content.
    """
    visited = set()
    pages = []
    domain = urlparse(website_url).netloc
    to_visit = [website_url]

    browser_config = BrowserConfig(headless=True)
    crawl_config = CrawlerRunConfig()

    async with AsyncWebCrawler(config=browser_config) as crawler:
        while to_visit and len(pages) < max_pages:
            url = to_visit.pop(0)

            # Skip already-visited URLs
            if url in visited:
                continue
            visited.add(url)

            try:
                result = await crawler.arun(url=url, config=crawl_config)

                if not result.success:
                    continue

                # Get clean markdown text content
                content = ""
                if result.markdown_v2:
                    content = result.markdown_v2.raw_markdown or ""
                elif result.markdown:
                    content = result.markdown

                # Extract page title from metadata
                title = url
                if result.metadata and isinstance(result.metadata, dict):
                    title = result.metadata.get("title", url)

                pages.append({
                    "url": url,
                    "title": title,
                    "content": content,
                })

                # Extract internal links to continue crawling
                if result.links and isinstance(result.links, dict):
                    for link in result.links.get("internal", []):
                        href = link.get("href", "")
                        if not href:
                            continue

                        # Resolve relative URLs to absolute
                        full_url = urljoin(url, href)

                        # Only follow links on the same domain
                        if (
                            urlparse(full_url).netloc == domain
                            and full_url not in visited
                        ):
                            to_visit.append(full_url)

            except Exception as e:
                print(f"Error crawling {url}: {e}")
                continue

    return pages
