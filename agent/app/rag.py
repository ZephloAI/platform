"""
RAG (Retrieval-Augmented Generation) module.

This module handles:
1. Generating embeddings for user queries using sentence-transformers.
2. Searching the Qdrant vector database for relevant website chunks.
3. Formatting retrieved chunks into context for the LLM.

How it works:
- When a user sends a message, we convert it into a vector (embedding).
- We search Qdrant for stored website chunks that are similar to that vector.
- We format those chunks into a text block the LLM can use as context.
"""

from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

from app.config import settings

# ──────────────────────────────────────────────────────────────────────
# Load the embedding model once at startup.
# all-MiniLM-L6-v2 produces 384-dimensional vectors.
# This must match the vector dimension used when indexing into Qdrant.
# ──────────────────────────────────────────────────────────────────────
embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)


def get_qdrant_client() -> QdrantClient:
    """
    Create and return a Qdrant client connection.

    Returns:
        QdrantClient configured to talk to the Qdrant instance.
    """
    return QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)


def get_collection_name(chatbot_name: str, chatbot_id: int) -> str:
    """
    Build the Qdrant collection name from chatbot name and ID.
    Must match the naming convention used by the crawler service.
    Example: "Zurisun_2"
    """
    import re
    sanitized = re.sub(r"[^a-zA-Z0-9\s]", "", chatbot_name)
    sanitized = sanitized.strip().replace(" ", "_")
    if not sanitized:
        sanitized = "chatbot"
    return f"{sanitized}_{chatbot_id}"


def retrieve_context(chatbot_id: int, query: str, top_k: int = 5, chatbot_name: str = "") -> list[dict]:
    """
    Search Qdrant for website chunks relevant to the user's query.

    How it works:
    1. Convert the user's query text into a 384-dim embedding vector.
    2. Query the Qdrant collection for that chatbot ({name}_{id}).
    3. Return the top-k most similar chunks with their metadata.

    Args:
        chatbot_id:   ID of the chatbot.
        query:        The user's question or message.
        top_k:        Number of similar chunks to retrieve (default: 5).
        chatbot_name: Name of the chatbot (used in collection name).

    Returns:
        List of dicts, each containing: text, url, title, score.
        Returns empty list if the search fails (e.g., collection not found).
    """
    # Step 1: Generate embedding for the user's query
    query_embedding = embedding_model.encode(query).tolist()

    # Step 2: Search the Qdrant collection for this chatbot
    client = get_qdrant_client()
    collection_name = get_collection_name(chatbot_name, chatbot_id)

    try:
        results = client.query_points(
            collection_name=collection_name,
            query=query_embedding,
            limit=top_k,
            with_payload=True,
        )
    except Exception as e:
        # This can happen if the collection doesn't exist yet
        # (e.g., the website hasn't been crawled) or Qdrant is unreachable.
        print(f"Qdrant search error: {e}")
        return []

    # Step 3: Format the results into a simple list of dicts
    contexts = []
    for point in results.points:
        contexts.append(
            {
                "text": point.payload.get("text", ""),
                "url": point.payload.get("url", ""),
                "title": point.payload.get("title", ""),
                "score": point.score,
            }
        )

    return contexts


def format_context_for_llm(contexts: list[dict]) -> str:
    """
    Format retrieved chunks into a readable context string for the LLM.

    The LLM needs the website content as plain text so it can reference it
    when answering the user's question. Each chunk is labeled with its
    source URL and title.

    Args:
        contexts: List of chunk dicts from retrieve_context().

    Returns:
        Formatted string ready to include in the LLM prompt.
    """
    if not contexts:
        return "No relevant information found."

    formatted = ""
    for i, ctx in enumerate(contexts, 1):
        formatted += f"--- {ctx['title']} ---\n"
        formatted += f"{ctx['text']}\n\n"

    return formatted
