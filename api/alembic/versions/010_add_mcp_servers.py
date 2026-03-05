"""Add mcp_servers to chatbots table.

Revision ID: 010
Revises: 009
Create Date: 2026-02-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("mcp_servers", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "mcp_servers")
