"""Add is_active to chatbots table.

Revision ID: 014
Revises: 013
Create Date: 2026-03-10 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chatbots",
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("chatbots", "is_active")
