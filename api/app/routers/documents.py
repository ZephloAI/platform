"""Document management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories.chatbot_repository import ChatbotRepository
from app.schemas.document import DocumentResponse, DocumentStatusUpdate
from app.services.document_service import DocumentService

router = APIRouter(prefix="/api", tags=["documents"])


async def _resolve_chatbot(db: AsyncSession, agent_id: str):
    """Resolve a chatbot by its public_id. Raises 404 if not found."""
    repo = ChatbotRepository(db)
    chatbot = await repo.get_by_public_id(agent_id)
    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )
    return chatbot


@router.post(
    "/agents/{agent_id}/documents",
    response_model=DocumentResponse,
)
async def upload_document(
    agent_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF document to add to the chatbot's knowledge base."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = DocumentService(db)
    return await service.upload(chatbot.id, user.id, file)


@router.get(
    "/agents/{agent_id}/documents",
    response_model=list[DocumentResponse],
)
async def list_documents(
    agent_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for a chatbot."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = DocumentService(db)
    return await service.list_documents(chatbot.id, user.id)


@router.delete("/agents/{agent_id}/documents/{document_id}")
async def delete_document(
    agent_id: str,
    document_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document from the chatbot's knowledge base."""
    chatbot = await _resolve_chatbot(db, agent_id)
    service = DocumentService(db)
    await service.delete_document(chatbot.id, document_id, user.id)
    return {"ok": True}


@router.patch("/internal/documents/{document_id}")
async def update_document_status(
    document_id: int,
    body: DocumentStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Crawler callback to update document processing status."""
    service = DocumentService(db)
    await service.update_status(
        document_id=document_id,
        doc_status=body.status,
        chunks_indexed=body.chunks_indexed,
        error=body.error,
    )
    return {"ok": True}
