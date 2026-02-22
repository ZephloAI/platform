"""
FastAPI application entry point.

Sets up the app, CORS middleware, and includes all routers.
Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, chatbots, crawl_jobs, public_chat, session

# Create the FastAPI application
app = FastAPI(
    title="Chatbot SaaS API",
    description="API for the website chatbot SaaS platform",
    version="1.0.0",
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


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}
