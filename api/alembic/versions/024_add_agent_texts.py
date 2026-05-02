"""Add agent_texts table for raw text knowledge sources.

Revision ID: 024
Revises: 023
Create Date: 2026-04-20
"""

from alembic import op
import sqlalchemy as sa

revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "agent_texts",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "chatbot_id",
            sa.Integer(),
            sa.ForeignKey("chatbots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), server_default="pending"),
        sa.Column("chunks_indexed", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("agent_texts")
