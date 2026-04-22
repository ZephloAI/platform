"""Text service for raw text knowledge sources.

Mirrors DocumentService but for pasted text — no S3 upload needed.
The text is sent directly to the crawler for chunking, embedding, and indexing.
"""

from datetime import datetime

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.repositories.agent_text_repository import AgentTextRepository
from app.repositories.chatbot_repository import ChatbotRepository


# Cap content size at ~1MB of text to avoid abuse / oversized payloads
MAX_TEXT_BYTES = 1_000_000


class TextService:
    def __init__(self, db: AsyncSession):
        self.text_repo = AgentTextRepository(db)
        self.chatbot_repo = ChatbotRepository(db)

    async def upload(self, chatbot_id: int, user_id: int, title: str, content: str):
        """Create a raw text record and trigger crawler processing."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        if len(content.encode("utf-8")) > MAX_TEXT_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content exceeds 1MB limit",
            )

        text_record = await self.text_repo.create(
            chatbot_id=chatbot_id,
            title=title,
            content=content,
            status="pending",
        )

        callback_url = f"{settings.API_CALLBACK_URL}/api/internal/agent-texts/{text_record.id}"
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.CRAWLER_SERVICE_URL}/process-text",
                    json={
                        "chatbot_id": chatbot_id,
                        "chatbot_name": chatbot.name,
                        "text_id": text_record.id,
                        "title": title,
                        "content": content,
                        "callback_url": callback_url,
                    },
                    timeout=10.0,
                )
        except httpx.RequestError:
            pass  # Stays "pending" — crawler may pick it up later

        return text_record

    async def update(
        self, chatbot_id: int, text_id: int, user_id: int, title: str, content: str
    ):
        """Edit an existing text: re-index from scratch with new content."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        record = await self.text_repo.get_by_id(text_id)
        if not record or record.chatbot_id != chatbot_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent text not found",
            )

        if len(content.encode("utf-8")) > MAX_TEXT_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content exceeds 1MB limit",
            )

        # Drop old Qdrant points before re-indexing
        _delete_text_points_from_qdrant(chatbot.name, chatbot_id, text_id)

        updated = await self.text_repo.update(
            text_id,
            title=title,
            content=content,
            status="pending",
            chunks_indexed=0,
            processed_at=None,
        )

        callback_url = f"{settings.API_CALLBACK_URL}/api/internal/agent-texts/{text_id}"
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.CRAWLER_SERVICE_URL}/process-text",
                    json={
                        "chatbot_id": chatbot_id,
                        "chatbot_name": chatbot.name,
                        "text_id": text_id,
                        "title": title,
                        "content": content,
                        "callback_url": callback_url,
                    },
                    timeout=10.0,
                )
        except httpx.RequestError:
            pass

        return updated

    async def update_status(
        self,
        text_id: int,
        text_status: str,
        chunks_indexed: int = 0,
        error: str | None = None,
    ):
        """Update text status (called by crawler callback)."""
        record = await self.text_repo.get_by_id(text_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent text not found",
            )

        update_fields = {"status": text_status, "chunks_indexed": chunks_indexed}
        if text_status in ("ready", "error"):
            update_fields["processed_at"] = datetime.utcnow()

        return await self.text_repo.update(text_id, **update_fields)

    async def list_texts(self, chatbot_id: int, user_id: int):
        """List all texts for a chatbot."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        return await self.text_repo.get_all(chatbot_id=chatbot_id)

    async def delete_text(self, chatbot_id: int, text_id: int, user_id: int):
        """Delete a text from DB and remove its points from Qdrant."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        record = await self.text_repo.get_by_id(text_id)
        if not record or record.chatbot_id != chatbot_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent text not found",
            )

        _delete_text_points_from_qdrant(chatbot.name, chatbot_id, text_id)

        await self.text_repo.delete(text_id)
        return True


def _delete_text_points_from_qdrant(chatbot_name: str, chatbot_id: int, text_id: int) -> None:
    """Best-effort removal of Qdrant points belonging to a single text snippet."""
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        import re

        qdrant = QdrantClient(host="qdrant", port=6333)
        sanitized = re.sub(r"[^a-zA-Z0-9\s]", "", chatbot_name)
        sanitized = sanitized.strip().replace(" ", "_")
        if not sanitized:
            sanitized = "chatbot"
        collection_name = f"{sanitized}_{chatbot_id}"

        qdrant.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(key="source_type", match=MatchValue(value="text")),
                    FieldCondition(key="url", match=MatchValue(value=f"agent-text://{text_id}")),
                ]
            ),
        )
    except Exception:
        pass
