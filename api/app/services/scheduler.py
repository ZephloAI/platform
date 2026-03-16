"""Periodic re-crawl scheduler using APScheduler."""

import asyncio
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import select

from app.database import async_session
from app.models.chatbot import Chatbot
from app.services.crawl_service import CrawlService

scheduler = BackgroundScheduler()


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

        now = datetime.utcnow()
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


def _run_check():
    """Wrapper to run the async check in a new event loop."""
    asyncio.run(_check_recrawls())


def start_scheduler():
    """Start the background scheduler."""
    scheduler.add_job(_run_check, "interval", hours=2, id="recrawl_check")
    scheduler.start()
    print("Re-crawl scheduler started (checking every 2 hours)")


def stop_scheduler():
    """Stop the background scheduler."""
    scheduler.shutdown(wait=False)
    print("Re-crawl scheduler stopped")
