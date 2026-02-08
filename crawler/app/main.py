"""
Crawler service FastAPI application.

This is the entry point for the crawler microservice. It receives
crawl requests from the API service, processes websites in the
background, and stores the results in Qdrant for later RAG queries.
"""

from fastapi import FastAPI

from app.routers.crawl import router as crawl_router

app = FastAPI(
    title="Crawler Service",
    description="Crawls websites, chunks content, generates embeddings, and stores them in Qdrant.",
    version="1.0.0",
)

# Register the crawl router (provides /crawl and /health endpoints)
app.include_router(crawl_router)
