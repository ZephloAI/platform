"""
Qdrant vector database indexing.

Handles creating collections and storing embedded chunks in Qdrant.
Each chatbot gets its own collection named "{name}_{id}" (e.g. "Zurisun_2").
"""

import re
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

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
                    "source_type": chunk.get("source_type", "web"),
                },
            )
        )

    # Upload in batches of 100 to avoid large single requests
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(collection_name=collection_name, points=batch)


def ensure_collection(chatbot_name: str, chatbot_id: int):
    """
    Create a Qdrant collection for a chatbot only if it doesn't exist yet.

    Unlike create_collection(), this does NOT delete existing data.
    Safe to call before indexing documents alongside existing web content.
    """
    client = get_qdrant_client()
    collection_name = get_collection_name(chatbot_name, chatbot_id)

    try:
        client.get_collection(collection_name)
    except Exception:
        # Collection doesn't exist -- create it
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def delete_web_points(chatbot_name: str, chatbot_id: int):
    """
    Delete only the web-sourced points from a chatbot's collection.

    This preserves document-sourced points (e.g. PDFs) while allowing
    web content to be re-crawled fresh.
    """
    client = get_qdrant_client()
    collection_name = get_collection_name(chatbot_name, chatbot_id)

    web_filter = Filter(
        must=[
            FieldCondition(
                key="source_type",
                match=MatchValue(value="web"),
            )
        ]
    )

    # Scroll through all web points and collect their IDs
    point_ids = []
    offset = None
    while True:
        results, next_offset = client.scroll(
            collection_name=collection_name,
            scroll_filter=web_filter,
            limit=100,
            offset=offset,
        )
        point_ids.extend([point.id for point in results])
        if next_offset is None:
            break
        offset = next_offset

    # Delete collected web points
    if point_ids:
        client.delete(
            collection_name=collection_name,
            points_selector=point_ids,
        )
