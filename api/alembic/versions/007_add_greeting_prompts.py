"""Add greeting prompts columns to chatbots table.

Revision ID: 007
Revises: 006
Create Date: 2026-02-17 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("greeting_prompts", sa.JSON(), nullable=True))
    op.add_column("chatbots", sa.Column("greeting_prompt_duration", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "greeting_prompt_duration")
    op.drop_column("chatbots", "greeting_prompts")
