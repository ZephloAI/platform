"""Add api_keys table.

Revision ID: 011
Revises: 010
Create Date: 2026-03-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "api_keys",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "chatbot_id",
            sa.Integer(),
            sa.ForeignKey("chatbots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("key", sa.String(), unique=True, nullable=False, index=True),
        sa.Column("key_prefix", sa.String(8), nullable=False),
        sa.Column("name", sa.String(), server_default="Default"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
        ),
        sa.Column("last_used_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("api_keys")
