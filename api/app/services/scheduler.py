"""Periodic re-crawl scheduler using APScheduler."""

from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.database import async_session
from app.models.chatbot import Chatbot
from app.services.crawl_service import CrawlService

# AsyncIOScheduler runs jobs as coroutines on the app's running event loop.
# This is required because our DB connections live on that same loop - using a
# BackgroundScheduler (separate thread + asyncio.run) would create a new event
# loop per run and corrupt the shared connection pool.
scheduler = AsyncIOScheduler()


async def _check_recrawls():
    """Check all chatbots and trigger re-crawls for those that are due."""
    async with async_session() as db:
        result = await db.execute(
            select(Chatbot).where(
                Chatbot.auto_recrawl_enabled == True,
                Chatbot.status.in_(["ready", "active"]),
                Chatbot.crawled_urls.isnot(None),
            )
        )
        chatbots = result.scalars().all()

        now = datetime.now(timezone.utc)
        crawl_service = CrawlService(db)

        for chatbot in chatbots:
            # Skip if never crawled or not yet due
            if not chatbot.last_crawled_at:
                continue
            interval = timedelta(hours=chatbot.recrawl_interval_hours or 48)
            if chatbot.last_crawled_at + interval > now:
                continue

            print(f"Auto re-crawl triggered for chatbot {chatbot.id} ({chatbot.name})")
            await crawl_service.start_auto_recrawl(chatbot.id)


def start_scheduler():
    """Start the background scheduler."""
    # The coroutine is scheduled directly - AsyncIOScheduler awaits it on the
    # app's event loop, so DB sessions reuse the same loop as the engine.
    scheduler.add_job(_check_recrawls, "interval", hours=2, id="recrawl_check")
    scheduler.start()
    print("Re-crawl scheduler started (checking every 2 hours)")


def stop_scheduler():
    """Stop the background scheduler."""
    scheduler.shutdown(wait=False)
    print("Re-crawl scheduler stopped")
