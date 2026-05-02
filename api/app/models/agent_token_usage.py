"""
Per-call token usage row written by the agent service.

This table is the fine-grained audit trail. The cheap read-side aggregate
lives on `organizations.tokens_used_in_period` — admins and enforcement
never scan this table. Query it for debugging, reconciliation, or
per-Agent breakdowns where a full scan is acceptable.
"""

from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Integer, String, func

from app.models.base import Base


class AgentTokenUsage(Base):
    __tablename__ = "agent_token_usage"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chatbot_id = Column(
        Integer,
        ForeignKey("chatbots.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    session_id = Column(String, nullable=True, index=True)
    model = Column(String, nullable=True)
    prompt_tokens = Column(Integer, nullable=False, server_default="0")
    completion_tokens = Column(Integer, nullable=False, server_default="0")
    total_tokens = Column(BigInteger, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
