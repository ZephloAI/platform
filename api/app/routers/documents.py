"""Document management endpoints."""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentStatusUpdate
from app.services.document_service import DocumentService

router = APIRouter(prefix="/api", tags=["documents"])


@router.post(
    "/chatbots/{chatbot_id}/documents",
    response_model=DocumentResponse,
)
async def upload_document(
    chatbot_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a PDF document to add to the chatbot's knowledge base."""
    service = DocumentService(db)
    return await service.upload(chatbot_id, user.id, file)


@router.get(
    "/chatbots/{chatbot_id}/documents",
    response_model=list[DocumentResponse],
)
async def list_documents(
    chatbot_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all documents for a chatbot."""
    service = DocumentService(db)
    return await service.list_documents(chatbot_id, user.id)


@router.delete("/chatbots/{chatbot_id}/documents/{document_id}")
async def delete_document(
    chatbot_id: int,
    document_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document from the chatbot's knowledge base."""
    service = DocumentService(db)
    await service.delete_document(chatbot_id, document_id, user.id)
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
