"""Add documents table and auto re-crawl columns to chatbots.

Revision ID: 020
Revises: 019
Create Date: 2026-03-15
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create documents table
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("chatbot_id", sa.Integer(), sa.ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("s3_url", sa.String(), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), server_default="pending"),
        sa.Column("chunks_indexed", sa.Integer(), server_default="0"),
        sa.Column("uploaded_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
    )

    # Add auto re-crawl columns to chatbots
    op.add_column("chatbots", sa.Column("auto_recrawl_enabled", sa.Boolean(), server_default="true"))
    op.add_column("chatbots", sa.Column("recrawl_interval_hours", sa.Integer(), server_default="48"))
    op.add_column("chatbots", sa.Column("last_crawled_at", sa.DateTime(), nullable=True))
    op.add_column("chatbots", sa.Column("crawled_urls", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "crawled_urls")
    op.drop_column("chatbots", "last_crawled_at")
    op.drop_column("chatbots", "recrawl_interval_hours")
    op.drop_column("chatbots", "auto_recrawl_enabled")
    op.drop_table("documents")
