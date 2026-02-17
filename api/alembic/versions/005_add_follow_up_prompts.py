"""Add follow_up_prompts column to chatbots table.

Revision ID: 005
Revises: 004
Create Date: 2026-02-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("follow_up_prompts", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "follow_up_prompts")
