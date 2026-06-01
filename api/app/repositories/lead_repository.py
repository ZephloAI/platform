"""Lead repository - one row per (chatbot, session); updates merge non-empty fields."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.repositories.base import BaseRepository


# Fields the agent can supply over time. Listed once so add/remove stays simple.
_CAPTURE_FIELDS = ("name", "email", "phone", "company", "interest")


class LeadRepository(BaseRepository[Lead]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, Lead)

    async def get_by_session(
        self, chatbot_id: int, session_id: UUID
    ) -> Lead | None:
        result = await self.db.execute(
            select(Lead).where(
                Lead.chatbot_id == chatbot_id,
                Lead.session_id == session_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_chatbot(self, chatbot_id: int) -> list[Lead]:
        """Return leads for a chatbot, newest activity first."""
        result = await self.db.execute(
            select(Lead)
            .where(Lead.chatbot_id == chatbot_id)
            .order_by(Lead.updated_at.desc())
        )
        return list(result.scalars().all())

    async def upsert(
        self,
        *,
        chatbot_id: int,
        session_id: UUID,
        name: str | None = None,
        email: str | None = None,
        phone: str | None = None,
        company: str | None = None,
        interest: str | None = None,
    ) -> Lead:
        """Insert a new lead or merge non-empty fields into an existing one.

        None / empty values never overwrite a previously set field.
        """
        incoming = {
            "name": name,
            "email": email,
            "phone": phone,
            "company": company,
            "interest": interest,
        }

        lead = await self.get_by_session(chatbot_id, session_id)
        if lead is None:
            lead = Lead(
                chatbot_id=chatbot_id,
                session_id=session_id,
                **{k: v for k, v in incoming.items() if v},
            )
            self.db.add(lead)
        else:
            for field in _CAPTURE_FIELDS:
                value = incoming.get(field)
                if value:
                    setattr(lead, field, value)

        await self.db.commit()
        await self.db.refresh(lead)
        return lead
