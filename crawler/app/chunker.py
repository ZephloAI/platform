"""
Text chunking utilities.

Splits long text into smaller overlapping chunks suitable for
embedding generation. Uses simple character-based chunking with
smart boundary detection (sentences, newlines, spaces).
"""


def chunk_text(
    text: str, chunk_size: int = 500, overlap: int = 50
) -> list[str]:
    """
    Split text into overlapping chunks.

    Tries to break at natural boundaries (sentences, newlines, spaces)
    rather than cutting mid-word. Filters out very small chunks.

    Args:
        text: The input text to chunk.
        chunk_size: Target number of characters per chunk.
        overlap: Number of overlapping characters between chunks.

    Returns:
        List of text chunks (each at least 20 characters).
    """
    if not text or len(text) == 0:
        return []

    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]

        # Try to break at a natural boundary instead of mid-word
        if end < len(text):
            for sep in [". ", "\n", " "]:
                last_sep = chunk.rfind(sep)
                # Only break at boundary if it's past the halfway point
                if last_sep > chunk_size * 0.5:
                    chunk = chunk[: last_sep + 1]
                    end = start + last_sep + 1
                    break

        chunks.append(chunk.strip())
        start = end - overlap

    # Filter out tiny chunks that won't be useful for search
    return [c for c in chunks if len(c) > 20]
