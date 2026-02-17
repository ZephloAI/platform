"""Add quick_prompts column to chatbots table.

Revision ID: 004
Revises: 003
Create Date: 2026-02-11 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("quick_prompts", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "quick_prompts")
