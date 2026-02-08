"""
FastAPI application entry point.

Sets up the app, CORS middleware, and includes all routers.
Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, chatbots, crawl_jobs, chat

# Create the FastAPI application
app = FastAPI(
    title="Chatbot SaaS API",
    description="API for the website chatbot SaaS platform",
    version="1.0.0",
)

# CORS middleware - allow frontend dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:80",    # Production frontend
        "http://localhost",       # Production frontend (no port)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(chatbots.router)
app.include_router(crawl_jobs.router)
app.include_router(chat.router)


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}
