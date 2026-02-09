"""Add widget customization columns to chatbots table.

Revision ID: 003
Revises: 002
Create Date: 2026-02-09 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("widget_icon", sa.String(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_welcome", sa.String(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_position", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "widget_position")
    op.drop_column("chatbots", "widget_welcome")
    op.drop_column("chatbots", "widget_icon")
