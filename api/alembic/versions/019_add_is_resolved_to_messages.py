"""Add is_resolved column to messages table.

Revision ID: 019
Revises: 018_add_messages_and_chat_modes
Create Date: 2026-03-13
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("is_resolved", sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "is_resolved")
