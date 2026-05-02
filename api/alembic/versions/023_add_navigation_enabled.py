"""Add navigation_enabled to chatbots table.

Revision ID: 023
Revises: 022
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa

revision = "023"
down_revision = "022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "chatbots",
        sa.Column(
            "navigation_enabled",
            sa.Boolean(),
            server_default="false",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("chatbots", "navigation_enabled")
