"""Lead service - validates input and orchestrates the lead upsert + list."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.repositories.chatbot_repository import ChatbotRepository
from app.repositories.lead_repository import LeadRepository
from app.models.chat_session import ChatSession
from sqlalchemy import select

from app.schemas.lead import LeadCreate


class LeadService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.leads = LeadRepository(db)
        self.chatbots = ChatbotRepository(db)

    async def upsert_from_agent(self, body: LeadCreate) -> Lead:
        """Called by the internal endpoint (agent service callback).

        Verifies the session belongs to the chatbot and at least one
        capture field was provided, then upserts.
        """
        # Reject calls with nothing to save — catches accidental empty calls.
        if not any(
            getattr(body, f)
            for f in ("name", "email", "phone", "company", "interest")
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one of name/email/phone/company/interest is required",
            )

        # Confirm the session belongs to this chatbot before saving anything.
        result = await self.db.execute(
            select(ChatSession).where(
                ChatSession.id == body.session_id,
                ChatSession.chatbot_id == body.chatbot_id,
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found for this agent",
            )

        return await self.leads.upsert(
            chatbot_id=body.chatbot_id,
            session_id=body.session_id,
            name=body.name,
            email=str(body.email) if body.email else None,
            phone=body.phone,
            company=body.company,
            interest=body.interest,
        )

    async def list_for_agent(
        self, chatbot_id: int, user_id: int
    ) -> list[Lead]:
        """Owner-facing list. Verifies ownership before returning."""
        chatbot = await self.chatbots.get_by_id(chatbot_id)
        if not chatbot or chatbot.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
            )
        return await self.leads.list_for_chatbot(chatbot_id)
