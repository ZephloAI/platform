"""Document service for PDF upload and management."""

from datetime import datetime

import httpx
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.repositories.chatbot_repository import ChatbotRepository
from app.repositories.document_repository import DocumentRepository
from app.services.s3_storage import upload_document


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.document_repo = DocumentRepository(db)
        self.chatbot_repo = ChatbotRepository(db)

    async def upload(
        self, chatbot_id: int, user_id: int, file: UploadFile
    ):
        """Upload a PDF document and trigger processing."""
        # Verify ownership
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        # Validate file
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are supported",
            )

        # Read content to check size (max 20MB)
        content = await file.read()
        if len(content) > 20 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 20MB limit",
            )
        # Reset file position for upload
        await file.seek(0)

        # Upload to S3
        s3_url = await upload_document(file, chatbot_id)

        # Create database record
        document = await self.document_repo.create(
            chatbot_id=chatbot_id,
            filename=file.filename,
            s3_url=s3_url,
            file_size=len(content),
            status="pending",
        )

        # Call crawler service to process the document
        callback_url = f"{settings.API_CALLBACK_URL}/api/internal/documents/{document.id}"
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.CRAWLER_SERVICE_URL}/process-document",
                    json={
                        "chatbot_id": chatbot_id,
                        "chatbot_name": chatbot.name,
                        "document_id": document.id,
                        "pdf_url": s3_url,
                        "callback_url": callback_url,
                    },
                    timeout=10.0,
                )
        except httpx.RequestError:
            pass  # Document stays "pending", crawler may pick it up later

        return document

    async def update_status(
        self, document_id: int, doc_status: str, chunks_indexed: int = 0, error: str | None = None
    ):
        """Update document status (called by crawler callback)."""
        document = await self.document_repo.get_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        update_fields = {"status": doc_status, "chunks_indexed": chunks_indexed}
        if doc_status in ("ready", "error"):
            update_fields["processed_at"] = datetime.utcnow()

        return await self.document_repo.update(document_id, **update_fields)

    async def list_documents(self, chatbot_id: int, user_id: int):
        """List all documents for a chatbot."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )
        return await self.document_repo.get_all(chatbot_id=chatbot_id)

    async def delete_document(self, chatbot_id: int, document_id: int, user_id: int):
        """Delete a document from DB and S3."""
        chatbot = await self.chatbot_repo.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found",
            )

        document = await self.document_repo.get_by_id(document_id)
        if not document or document.chatbot_id != chatbot_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        # Delete from Qdrant (points matching this document's URL)
        try:
            from qdrant_client import QdrantClient
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            import re

            qdrant = QdrantClient(host="qdrant", port=6333)
            sanitized = re.sub(r"[^a-zA-Z0-9\s]", "", chatbot.name)
            sanitized = sanitized.strip().replace(" ", "_")
            if not sanitized:
                sanitized = "chatbot"
            collection_name = f"{sanitized}_{chatbot_id}"

            qdrant.delete(
                collection_name=collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(key="source_type", match=MatchValue(value="document")),
                        FieldCondition(key="url", match=MatchValue(value=document.s3_url)),
                    ]
                ),
            )
        except Exception:
            pass  # Qdrant cleanup is best-effort

        await self.document_repo.delete(document_id)
        return True
