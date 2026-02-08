"""
Qdrant vector database indexing.

Handles creating collections and storing embedded chunks in Qdrant.
Each chatbot gets its own collection named "{name}_{id}" (e.g. "Zurisun_2").
"""

import re
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

from app.config import settings


def get_qdrant_client() -> QdrantClient:
    """Create a Qdrant client connected to the configured host."""
    return QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)


def get_collection_name(chatbot_name: str, chatbot_id: int) -> str:
    """
    Each chatbot gets its own Qdrant collection.
    Collection name format: {sanitized_name}_{id}
    Example: "Zurisun_2"
    """
    # Remove special characters, keep letters, numbers, and spaces
    sanitized = re.sub(r"[^a-zA-Z0-9\s]", "", chatbot_name)
    # Replace spaces with underscores and strip
    sanitized = sanitized.strip().replace(" ", "_")
    # Fallback if name is empty after sanitization
    if not sanitized:
        sanitized = "chatbot"
    return f"{sanitized}_{chatbot_id}"


def create_collection(chatbot_name: str, chatbot_id: int):
    """
    Create a Qdrant collection for a chatbot.

    If the collection already exists (e.g. from a previous crawl),
    it is deleted first so we start fresh.
    """
    client = get_qdrant_client()
    collection_name = get_collection_name(chatbot_name, chatbot_id)

    # Delete existing collection if present (for re-crawling)
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    # Create new collection with cosine similarity and 384-dim vectors
    # (384 matches the all-MiniLM-L6-v2 model output)
    client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )


def index_chunks(chatbot_name: str, chatbot_id: int, chunks: list[dict]):
    """
    Index embedded chunks into Qdrant.

    Each chunk dict should have: text, embedding, url, title.
    Chunks are uploaded in batches of 100 for efficiency.

    Args:
        chatbot_name: Name of the chatbot (used in collection name).
        chatbot_id: The chatbot this data belongs to.
        chunks: List of dicts with text, embedding, url, title keys.
    """
    client = get_qdrant_client()
    collection_name = get_collection_name(chatbot_name, chatbot_id)

    # Build Qdrant point objects from chunks
    points = []
    for chunk in chunks:
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=chunk["embedding"],
                payload={
                    "text": chunk["text"],
                    "url": chunk["url"],
                    "title": chunk["title"],
                    "chatbot_id": chatbot_id,
                },
            )
        )

    # Upload in batches of 100 to avoid large single requests
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(collection_name=collection_name, points=batch)
