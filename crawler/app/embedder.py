"""
Embedding generation using sentence-transformers.

Loads the embedding model once at module level and provides a
function to generate vector embeddings for text chunks.
The default model (all-MiniLM-L6-v2) produces 384-dimensional vectors.
"""

from sentence_transformers import SentenceTransformer

from app.config import settings

# Load the model once when this module is imported.
# This avoids reloading on every request (the model stays in memory).
model = SentenceTransformer(settings.EMBEDDING_MODEL)


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks.

    Args:
        texts: List of text strings to embed.

    Returns:
        List of embedding vectors (each is a list of floats).
    """
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()
