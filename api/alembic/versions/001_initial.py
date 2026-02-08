"""Initial migration - create users, chatbots, crawl_jobs, pages tables.

Revision ID: 001
Revises: None
Create Date: 2024-01-01 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# Revision identifiers used by Alembic
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # -- Users table --
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("email", sa.String(), unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # -- Chatbots table --
    op.create_table(
        "chatbots",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("website_url", sa.String(), nullable=False),
        sa.Column("status", sa.String(), server_default="pending"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # -- Crawl Jobs table --
    op.create_table(
        "crawl_jobs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "chatbot_id",
            sa.Integer(),
            sa.ForeignKey("chatbots.id"),
            nullable=False,
        ),
        sa.Column("status", sa.String(), server_default="pending"),
        sa.Column("pages_crawled", sa.Integer(), server_default="0"),
        sa.Column("started_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )

    # -- Pages table --
    op.create_table(
        "pages",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "chatbot_id",
            sa.Integer(),
            sa.ForeignKey("chatbots.id"),
            nullable=False,
        ),
        sa.Column("url", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("crawled_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("pages")
    op.drop_table("crawl_jobs")
    op.drop_table("chatbots")
    op.drop_table("users")
