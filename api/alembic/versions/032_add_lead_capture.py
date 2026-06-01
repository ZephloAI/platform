"""Add lead capture: chatbots.lead_capture_enabled + leads table.

Per-agent flag toggles the agent's capture_lead tool. The leads table holds
one row per (chatbot, session) — fields are filled in incrementally as the
agent learns more, so every capture field is nullable.

Revision ID: 032
Revises: 031
Create Date: 2026-06-01
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "032"
down_revision = "031"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chatbots",
        sa.Column(
            "lead_capture_enabled",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
    )

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("public_id", sa.String(), nullable=False),
        sa.Column(
            "chatbot_id",
            sa.Integer(),
            sa.ForeignKey("chatbots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("company", sa.String(), nullable=True),
        sa.Column("interest", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint(
            "chatbot_id", "session_id", name="uq_leads_chatbot_session"
        ),
    )
    op.create_index("ix_leads_public_id", "leads", ["public_id"], unique=True)
    op.create_index("ix_leads_chatbot_id", "leads", ["chatbot_id"])
    op.create_index("ix_leads_session_id", "leads", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_leads_session_id", table_name="leads")
    op.drop_index("ix_leads_chatbot_id", table_name="leads")
    op.drop_index("ix_leads_public_id", table_name="leads")
    op.drop_table("leads")
    op.drop_column("chatbots", "lead_capture_enabled")
