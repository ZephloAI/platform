"""Add composite index on messages(session_id, created_at DESC).

Supports the conversations list query which uses
``DISTINCT ON (session_id) ... ORDER BY session_id, created_at DESC``
to fetch the latest message per session in a single pass.

Revision ID: 029
Revises: 028
Create Date: 2026-05-14
"""

from alembic import op


revision = "029"
down_revision = "028"
branch_labels = None
depends_on = None


INDEX_NAME = "ix_messages_session_id_created_at_desc"


def upgrade() -> None:
    op.execute(
        f'CREATE INDEX IF NOT EXISTS {INDEX_NAME} '
        f'ON messages (session_id, created_at DESC)'
    )


def downgrade() -> None:
    op.execute(f'DROP INDEX IF EXISTS {INDEX_NAME}')
