"""
Crawl job orchestration.

Ties together the crawling, chunking, embedding, and indexing steps
into a single end-to-end pipeline. Sends progress callbacks to the
API service at each stage.
"""

import asyncio

import httpx

from app.config import settings
from app.scrapy_runner import stream_crawl, stream_discovery
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
    Run the crawl pipeline as a background task.

    There are two ways the page list is determined:
      - selected_urls given  -> crawl exactly those (a normal crawl, after the
        user picked pages in the streamed /discover step).
      - selected_urls empty  -> re-discover website_url first, then crawl what we
        find (a re-crawl, so new/removed pages are picked up).

    Each page is chunked, embedded, and indexed the moment Scrapy delivers it,
    and a progress callback is sent to the API after each one.

    Steps:
      1. Notify API that crawl is in progress
      2. Determine the URL list (selected, or freshly discovered)
      3. Make a fresh start for web content in Qdrant (keeps documents/text)
      4. Stream pages from Scrapy; for each: chunk -> embed -> index
      5. Send a progress update after each page
      6. Notify API when complete (or on failure)
    """
    try:
        # Step 1: Tell the API we've started
        await send_callback(callback_url, {"status": "in_progress"})

        # Step 2: Decide which URLs to crawl.
        if selected_urls:
            # Normal crawl: the user already picked these pages during discovery.
            urls = selected_urls
            print(f"Starting crawl for chatbot {chatbot_id}: {len(urls)} selected URLs")
        elif website_url:
            # Re-crawl: re-discover the site first so pages added or removed since
            # the last crawl are picked up, then crawl whatever we find.
            print(f"Re-discovering {website_url} for chatbot {chatbot_id}")
            urls = []
            async for page in stream_discovery(website_url, settings.MAX_PAGES):
                if "error" in page:
                    # Re-discovery failed before we touched Qdrant. Keep the
                    # existing website data intact and report the real reason.
                    await send_callback(callback_url, {
                        "status": "failed",
                        "error": page["error"],
                    })
                    return
                urls.append(page["url"])
            print(f"Re-discovery found {len(urls)} pages")
        else:
            urls = []

        if not urls:
            await send_callback(callback_url, {
                "status": "failed",
                "error": "No URLs were provided or discovered to crawl",
            })
            return

        # Step 3: Ensure the collection exists. We deliberately do NOT delete the
        # old web content yet -- that happens only once we actually have new
        # content to replace it with (see the loop below), so a crawl that fails
        # or finds nothing leaves the existing website data untouched.
        ensure_collection(chatbot_name, chatbot_id)

        # Now that we know the real page count, tell the API (a re-crawl's total
        # can differ from the original since we just re-discovered).
        await send_callback(callback_url, {
            "status": "in_progress",
            "pages_crawled": 0,
            "total_pages": len(urls),
        })

        # Step 4: Stream pages from Scrapy and index each as it arrives
        total_chunks_indexed = 0
        pages_done = 0
        cleared = False  # have we removed the old web content yet?
        errors = []  # reasons individual pages failed (for the all-failed case)
        async for page in stream_crawl(urls):
            # A failed page comes back as an error entry, not real content.
            if "error" in page:
                errors.append(page["error"])
                continue

            pages_done += 1
            content = page.get("content") or ""

            if content:
                chunks = chunk_text(
                    content,
                    chunk_size=settings.CHUNK_SIZE,
                    overlap=settings.CHUNK_OVERLAP,
                )
                if chunks:
                    # Embed + index off the event loop so Scrapy can keep
                    # fetching the next pages while this one is processed.
                    embeddings = await asyncio.to_thread(generate_embeddings, chunks)
                    # Clear the old web content only now that we have new content
                    # to put in its place -- a failed crawl never wipes existing data.
                    if not cleared:
                        await asyncio.to_thread(
                            delete_web_points, chatbot_name, chatbot_id
                        )
                        cleared = True
                    chunk_objects = [
                        {
                            "text": text,
                            "embedding": embedding,
                            "url": page["url"],
                            "title": page.get("title", page["url"]),
                            "source_type": "web",
                        }
                        for text, embedding in zip(chunks, embeddings)
                    ]
                    await asyncio.to_thread(
                        index_chunks, chatbot_name, chatbot_id, chunk_objects
                    )
                    total_chunks_indexed += len(chunk_objects)

            # Step 4: Send progress update after each page, including which page
            # was just crawled so the dashboard can show them appear live.
            await send_callback(callback_url, {
                "status": "in_progress",
                "pages_crawled": pages_done,
                "total_pages": len(urls),
                "page": {"url": page["url"], "title": page.get("title", page["url"])},
            })

        if pages_done == 0:
            # Nothing crawled -- report the website's own error if we have one,
            # so the dashboard shows why. Existing data was never deleted.
            await send_callback(callback_url, {
                "status": "failed",
                "error": errors[0] if errors else "No pages could be crawled from the website",
            })
            return

        # Step 5: Done -- notify API
        print(
            f"Crawl complete for chatbot {chatbot_id}: "
            f"{pages_done} pages, {total_chunks_indexed} chunks indexed"
        )
        await send_callback(callback_url, {
            "status": "completed",
            "pages_crawled": pages_done,
            "chunks_indexed": total_chunks_indexed,
        })

    except Exception as e:
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


async def run_text_job(
    chatbot_id: int,
    chatbot_name: str,
    text_id: int,
    title: str,
    content: str,
    callback_url: str,
):
    """
    Process a pasted raw text snippet and index its content as a background task.

    Steps:
      1. Notify API that processing has started
      2. Ensure the Qdrant collection exists (don't delete anything)
      3. Chunk the text, embed, and index with source_type="text"
      4. Notify API when complete (or on failure)

    The text is tagged in Qdrant with url=f"agent-text://{text_id}" so the
    delete endpoint can target only this snippet's points later.
    """
    try:
        await send_callback(callback_url, {"status": "processing"})

        print(f"Processing text {text_id} for chatbot {chatbot_id}: {title!r}")

        if not content.strip():
            await send_callback(callback_url, {
                "status": "error",
                "error": "Text content is empty",
            })
            return

        ensure_collection(chatbot_name, chatbot_id)

        chunks = chunk_text(
            content,
            chunk_size=settings.CHUNK_SIZE,
            overlap=settings.CHUNK_OVERLAP,
        )

        if not chunks:
            await send_callback(callback_url, {
                "status": "error",
                "error": "Text could not be chunked",
            })
            return

        embeddings = generate_embeddings(chunks)

        source_url = f"agent-text://{text_id}"
        chunk_objects = []
        for chunk_text_item, embedding in zip(chunks, embeddings):
            chunk_objects.append({
                "text": chunk_text_item,
                "embedding": embedding,
                "url": source_url,
                "title": title,
                "source_type": "text",
            })

        index_chunks(chatbot_name, chatbot_id, chunk_objects)

        print(
            f"Text {text_id} processed for chatbot {chatbot_id}: "
            f"{len(chunk_objects)} chunks indexed"
        )
        await send_callback(callback_url, {
            "status": "ready",
            "chunks_indexed": len(chunk_objects),
        })

    except Exception as e:
        print(f"Text processing failed for text {text_id}: {e}")
        await send_callback(callback_url, {
            "status": "error",
            "error": str(e),
        })
