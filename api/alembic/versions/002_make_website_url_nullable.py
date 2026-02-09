"""Make chatbot website_url nullable.

Chatbots no longer require a website URL at creation time.
Users add URLs later via the detail page.

Revision ID: 002
Revises: 001
Create Date: 2026-02-08 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# Revision identifiers used by Alembic
revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "chatbots",
        "website_url",
        existing_type=sa.String(),
        nullable=True,
    )


def downgrade() -> None:
    # Set any NULL values to empty string before making non-nullable
    op.execute("UPDATE chatbots SET website_url = '' WHERE website_url IS NULL")
    op.alter_column(
        "chatbots",
        "website_url",
        existing_type=sa.String(),
        nullable=False,
    )
