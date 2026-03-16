"""
Crawl job orchestration.

Ties together the crawling, chunking, embedding, and indexing steps
into a single end-to-end pipeline. Sends progress callbacks to the
API service at each stage.
"""

import httpx

from app.config import settings
from app.crawler import crawl_website, crawl_selected_urls
from app.chunker import chunk_text
from app.embedder import generate_embeddings
from app.indexer import create_collection, ensure_collection, delete_web_points, index_chunks
from app.pdf_processor import extract_text_from_pdf_url


async def send_callback(callback_url: str, data: dict):
    """
    Send a progress/status callback to the API service.

    Uses PATCH to update the crawl job status. Failures are logged
    but don't stop the crawl process.
    """
    try:
        async with httpx.AsyncClient() as client:
            await client.patch(callback_url, json=data, timeout=10.0)
    except Exception as e:
        print(f"Callback failed for {callback_url}: {e}")


async def run_crawl_job(
    chatbot_id: int,
    chatbot_name: str,
    website_url: str,
    crawl_job_id: int,
    callback_url: str,
    selected_urls: list[str] | None = None,
):
    """
    Run the full crawl pipeline as a background task.

    Steps:
      1. Notify API that crawl is in progress
      2. Crawl the website -- either spider the whole site OR fetch only
         the user-selected URLs if provided
      3. Create a fresh Qdrant collection for the chatbot
      4. For each page: chunk text -> embed chunks -> store in Qdrant
      5. Send progress updates after each page
      6. Notify API when complete (or on failure)

    Args:
        selected_urls: If provided, only these URLs are crawled (no link
            following). This is used after the user picks pages from the
            /discover endpoint.
    """
    try:
        # Step 1: Tell the API we've started
        await send_callback(callback_url, {"status": "in_progress"})

        # Step 2: Crawl the website
        if selected_urls:
            # User picked specific pages -- crawl only those
            print(
                f"Starting selective crawl for chatbot {chatbot_id}: "
                f"{len(selected_urls)} URLs"
            )
            pages = await crawl_selected_urls(selected_urls)
        else:
            # No selection -- spider the whole site as before
            print(f"Starting crawl for chatbot {chatbot_id}: {website_url}")
            pages = await crawl_website(website_url, max_pages=settings.MAX_PAGES)

        print(f"Crawled {len(pages)} pages from {website_url}")

        if not pages:
            await send_callback(callback_url, {
                "status": "failed",
                "error": "No pages could be crawled from the website",
            })
            return

        # Step 3: Ensure collection exists, then delete only web points
        # (this preserves any uploaded document content)
        ensure_collection(chatbot_name, chatbot_id)
        delete_web_points(chatbot_name, chatbot_id)

        # Step 4: Process each page
        total_chunks_indexed = 0
        for i, page in enumerate(pages):
            # Skip pages with no content
            if not page["content"]:
                continue

            # Chunk the page text
            chunks = chunk_text(
                page["content"],
                chunk_size=settings.CHUNK_SIZE,
                overlap=settings.CHUNK_OVERLAP,
            )

            if not chunks:
                continue

            # Generate embeddings for all chunks in this page
            embeddings = generate_embeddings(chunks)

            # Build chunk objects with metadata for Qdrant
            chunk_objects = []
            for text, embedding in zip(chunks, embeddings):
                chunk_objects.append({
                    "text": text,
                    "embedding": embedding,
                    "url": page["url"],
                    "title": page["title"],
                    "source_type": "web",
                })

            # Store in Qdrant
            index_chunks(chatbot_name, chatbot_id, chunk_objects)
            total_chunks_indexed += len(chunk_objects)

            # Send progress update after each page
            await send_callback(callback_url, {
                "status": "in_progress",
                "pages_crawled": i + 1,
                "total_pages": len(pages),
            })

        # Step 5: Done -- notify API
        print(
            f"Crawl complete for chatbot {chatbot_id}: "
            f"{len(pages)} pages, {total_chunks_indexed} chunks indexed"
        )
        await send_callback(callback_url, {
            "status": "completed",
            "pages_crawled": len(pages),
            "chunks_indexed": total_chunks_indexed,
        })

    except Exception as e:
        # Step 6: On any error, report failure
        print(f"Crawl failed for chatbot {chatbot_id}: {e}")
        await send_callback(callback_url, {
            "status": "failed",
            "error": str(e),
        })


async def run_document_job(
    chatbot_id: int,
    chatbot_name: str,
    document_id: int,
    pdf_url: str,
    callback_url: str,
):
    """
    Process a PDF document and index its content as a background task.

    Steps:
      1. Notify API that processing has started
      2. Download and extract text from the PDF
      3. Ensure the Qdrant collection exists (don't delete anything)
      4. Chunk, embed, and index the text
      5. Notify API when complete (or on failure)
    """
    try:
        # Step 1: Tell the API we've started processing
        await send_callback(callback_url, {"status": "processing"})

        # Step 2: Download and extract text from the PDF
        print(f"Processing document {document_id} for chatbot {chatbot_id}: {pdf_url}")
        text = extract_text_from_pdf_url(pdf_url)

        if not text.strip():
            await send_callback(callback_url, {
                "status": "error",
                "error": "No text could be extracted from the PDF",
            })
            return

        # Step 3: Ensure collection exists (don't delete anything)
        ensure_collection(chatbot_name, chatbot_id)

        # Step 4: Chunk the text, embed, and index
        chunks = chunk_text(
            text,
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP,
        )

        if not chunks:
            await send_callback(callback_url, {
                "status": "error",
                "error": "PDF text could not be chunked",
            })
            return

        embeddings = generate_embeddings(chunks)

        chunk_objects = []
        for chunk_text_item, embedding in zip(chunks, embeddings):
            chunk_objects.append({
                "text": chunk_text_item,
                "embedding": embedding,
                "url": pdf_url,
                "title": f"Document {document_id}",
                "source_type": "document",
            })

        index_chunks(chatbot_name, chatbot_id, chunk_objects)

        # Step 5: Done -- notify API
        print(
            f"Document {document_id} processed for chatbot {chatbot_id}: "
            f"{len(chunk_objects)} chunks indexed"
        )
        await send_callback(callback_url, {
            "status": "ready",
            "chunks_indexed": len(chunk_objects),
        })

    except Exception as e:
        print(f"Document processing failed for document {document_id}: {e}")
        await send_callback(callback_url, {
            "status": "error",
            "error": str(e),
        })
