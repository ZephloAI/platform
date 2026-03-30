"""Add OAuth support: nullable password_hash and user_oauth_providers table.

Revision ID: 022
Revises: 021
Create Date: 2026-03-30
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "022"
down_revision = "021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make password_hash nullable so OAuth users don't need a password
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=True)

    # Create OAuth providers table
    op.create_table(
        "user_oauth_providers",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("provider_user_id", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("provider", "provider_user_id", name="uq_provider_provider_user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_oauth_providers")
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=False)
