"""Add messages table, chat session modes, and person_mode_enabled to chatbots.

Revision ID: 018
Revises: 017_rename_owner_role_to_creator
Create Date: 2026-03-12
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers
revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to chat_sessions
    op.add_column("chat_sessions", sa.Column("mode", sa.String(), server_default="ai", nullable=False))
    op.add_column("chat_sessions", sa.Column("is_unread", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("chat_sessions", sa.Column("admin_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("chat_sessions", sa.Column("visitor_name", sa.String(), nullable=True))
    op.add_column("chat_sessions", sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True))

    # Create messages table
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("session_id", UUID(as_uuid=True), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_messages_session_id", "messages", ["session_id"])
    op.create_index("ix_messages_id", "messages", ["id"])

    # Add person_mode_enabled to chatbots
    op.add_column("chatbots", sa.Column("person_mode_enabled", sa.Boolean(), server_default="true", nullable=False))


def downgrade() -> None:
    op.drop_column("chatbots", "person_mode_enabled")
    op.drop_index("ix_messages_id", table_name="messages")
    op.drop_index("ix_messages_session_id", table_name="messages")
    op.drop_table("messages")
    op.drop_column("chat_sessions", "updated_at")
    op.drop_column("chat_sessions", "visitor_name")
    op.drop_column("chat_sessions", "admin_id")
    op.drop_column("chat_sessions", "is_unread")
    op.drop_column("chat_sessions", "mode")
