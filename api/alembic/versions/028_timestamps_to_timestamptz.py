"""Convert all naive timestamp columns to TIMESTAMPTZ.

Existing values were written as naive UTC, so we cast with
``AT TIME ZONE 'UTC'`` to attach UTC offset without shifting any values.

Revision ID: 028
Revises: 027
Create Date: 2026-04-28
"""

from alembic import op


revision = "028"
down_revision = "027"
branch_labels = None
depends_on = None


# (table, column) pairs that were defined as naive DateTime in models.
# Tables already on TIMESTAMPTZ (chat_sessions, messages) are intentionally
# excluded.
NAIVE_COLUMNS: list[tuple[str, str]] = [
    ("crawl_jobs", "started_at"),
    ("crawl_jobs", "completed_at"),
    ("users", "created_at"),
    ("users", "password_changed_at"),
    ("user_oauth_providers", "created_at"),
    ("organization_members", "joined_at"),
    ("organizations", "created_at"),
    ("organizations", "token_period_start"),
    ("agent_token_usage", "created_at"),
    ("agent_texts", "created_at"),
    ("agent_texts", "processed_at"),
    ("pages", "crawled_at"),
    ("api_keys", "created_at"),
    ("api_keys", "last_used_at"),
    ("password_reset_tokens", "created_at"),
    ("password_reset_tokens", "expires_at"),
    ("password_reset_tokens", "used_at"),
    ("chatbots", "created_at"),
    ("chatbots", "last_crawled_at"),
    ("invitations", "created_at"),
    ("invitations", "expires_at"),
    ("invitations", "last_sent_at"),
    ("invitations", "accepted_at"),
    ("documents", "uploaded_at"),
    ("documents", "processed_at"),
    ("audit_logs", "created_at"),
]


def upgrade() -> None:
    for table, column in NAIVE_COLUMNS:
        op.execute(
            f'ALTER TABLE {table} '
            f'ALTER COLUMN {column} TYPE TIMESTAMPTZ '
            f'USING {column} AT TIME ZONE \'UTC\''
        )


def downgrade() -> None:
    for table, column in NAIVE_COLUMNS:
        op.execute(
            f'ALTER TABLE {table} '
            f'ALTER COLUMN {column} TYPE TIMESTAMP '
            f'USING {column} AT TIME ZONE \'UTC\''
        )
