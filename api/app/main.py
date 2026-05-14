"""
FastAPI application entry point.

Sets up the app, CORS middleware, and includes all routers.
Run with: uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import http_client
from app.routers import admin, auth, chatbots, crawl_jobs, public_chat, session, api_keys, organizations, onboarding, conversations, internal, ws_admin, documents, texts
from app.services.scheduler import start_scheduler, stop_scheduler
from app import redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    await http_client.startup()
    start_scheduler()
    await redis_client.startup()
    yield
    await redis_client.shutdown()
    stop_scheduler()
    await http_client.shutdown()


# Create the FastAPI application
app = FastAPI(
    title="Zephlo API",
    description="API for the Zephlo website agent platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow all origins so the embeddable widget works on any website
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(chatbots.router)
app.include_router(crawl_jobs.router)
app.include_router(public_chat.router)
app.include_router(session.router)
app.include_router(api_keys.router)
app.include_router(organizations.router)
app.include_router(organizations.accept_router)
app.include_router(onboarding.router)
app.include_router(conversations.router)
app.include_router(internal.router)
app.include_router(ws_admin.router)
app.include_router(documents.router)
app.include_router(texts.router)
app.include_router(admin.router)


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}
