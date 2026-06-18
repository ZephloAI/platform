from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Defaults are provided for local development.
    """

    # Qdrant vector database connection
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333

    # API service URL (for callbacks)
    API_SERVICE_URL: str = "http://localhost:8000"

    # Crawling limits
    MAX_PAGES: int = 100  # Max pages to crawl per website

    # Identify as a real browser. The default Scrapy User-Agent gets blocked
    # (403 / bot challenge) by many sites and WAFs, which made discovery and
    # crawling silently return nothing.
    USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    # Scrapy concurrency (speed). Higher = faster but heavier on the target site.
    CONCURRENT_REQUESTS: int = 32  # total requests in flight
    CONCURRENT_REQUESTS_PER_DOMAIN: int = 16  # per-domain cap (the real limit, single site)

    # A page with fewer than this many characters of text is treated as a
    # JavaScript shell and retried through a headless browser (Playwright).
    EMPTY_CONTENT_THRESHOLD: int = 200

    # Text chunking settings
    CHUNK_SIZE: int = 500  # Characters per chunk
    CHUNK_OVERLAP: int = 50  # Overlap between chunks

    # Embedding model name (from sentence-transformers)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    class Config:
        env_file = ".env"


# Single settings instance used across the app
settings = Settings()
