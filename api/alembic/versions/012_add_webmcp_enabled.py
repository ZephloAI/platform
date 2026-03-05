"""Add webmcp_enabled to chatbots table.

Revision ID: 012
Revises: 011
Create Date: 2026-03-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chatbots",
        sa.Column(
            "webmcp_enabled",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("chatbots", "webmcp_enabled")
