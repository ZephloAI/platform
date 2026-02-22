"""Add chat_sessions table.

Revision ID: 008
Revises: 007
Create Date: 2026-02-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), primary_key=True),
        sa.Column("chatbot_id", sa.Integer(), sa.ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_chat_sessions_chatbot_id", "chat_sessions", ["chatbot_id"])


def downgrade() -> None:
    op.drop_index("ix_chat_sessions_chatbot_id")
    op.drop_table("chat_sessions")
