"""Add total_pages and crawled_pages to crawl_jobs.

Supports the live per-page crawl view: total_pages is set when a crawl starts
(count of selected URLs) and crawled_pages accumulates {url, title} as each page
is indexed, so the dashboard can show pages appear live, then collapse to the
summary card when the job completes.

Revision ID: 030
Revises: 029
Create Date: 2026-05-25
"""

import sqlalchemy as sa
from alembic import op


revision = "030"
down_revision = "029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("crawl_jobs", sa.Column("total_pages", sa.Integer(), nullable=True))
    op.add_column("crawl_jobs", sa.Column("crawled_pages", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("crawl_jobs", "crawled_pages")
    op.drop_column("crawl_jobs", "total_pages")
