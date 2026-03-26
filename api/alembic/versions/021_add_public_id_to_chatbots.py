"""Add public_id (UUID) column to chatbots for external-facing references.

Revision ID: 021
Revises: 020
Create Date: 2026-03-25
"""

from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add column as nullable first
    op.add_column("chatbots", sa.Column("public_id", sa.String(), nullable=True))

    # 2. Backfill existing rows with unique UUIDs
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM chatbots")).fetchall()
    for row in rows:
        conn.execute(
            sa.text("UPDATE chatbots SET public_id = :pid WHERE id = :id"),
            {"pid": str(uuid4()), "id": row[0]},
        )

    # 3. Set NOT NULL and add unique index
    op.alter_column("chatbots", "public_id", nullable=False)
    op.create_index("ix_chatbots_public_id", "chatbots", ["public_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_chatbots_public_id", table_name="chatbots")
    op.drop_column("chatbots", "public_id")
