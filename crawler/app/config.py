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
    MAX_PAGES: int = 50  # Max pages to crawl per website

    # Text chunking settings
    CHUNK_SIZE: int = 500  # Characters per chunk
    CHUNK_OVERLAP: int = 50  # Overlap between chunks

    # Embedding model name (from sentence-transformers)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    class Config:
        env_file = ".env"


# Single settings instance used across the app
settings = Settings()
