"""
Configuration module for the Agent Service.

Loads settings from environment variables (or a .env file).
See .env.example for all available configuration options.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Attributes:
        QDRANT_HOST:          Hostname of the Qdrant vector database.
        QDRANT_PORT:          Port number for the Qdrant instance.
        OPENROUTER_API_KEY:   API key for OpenRouter LLM access.
        OPENROUTER_BASE_URL:  Base URL for the OpenRouter API.
        LLM_MODEL:            Which LLM model to use via OpenRouter.
        EMBEDDING_MODEL:      sentence-transformers model for query embeddings.
        TOP_K:                Number of similar chunks to retrieve from Qdrant.
    """

    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_MODEL: str = "meta-llama/llama-3.1-8b-instruct:free"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    TOP_K: int = 5  # Number of chunks to retrieve from vector search

    class Config:
        env_file = ".env"


# Create a single settings instance used throughout the app
settings = Settings()
