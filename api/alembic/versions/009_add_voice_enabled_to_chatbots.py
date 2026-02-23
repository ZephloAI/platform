"""Add voice_enabled to chatbots table.

Revision ID: 009
Revises: 008
Create Date: 2026-02-23 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("voice_enabled", sa.Boolean(), server_default="false", nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "voice_enabled")
