"""Add onboarding fields to users and organizations.

Adds first_name, last_name, phone, country, onboarding_completed to users.
Adds size, phone to organizations.
Marks all existing users as onboarding_completed=true.

Revision ID: 016
Revises: 015
Create Date: 2026-03-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users: add profile and onboarding fields
    op.add_column("users", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    # Organizations: add size and phone
    op.add_column("organizations", sa.Column("size", sa.String(), nullable=True))
    op.add_column("organizations", sa.Column("phone", sa.String(), nullable=True))

    # Mark all existing users as having completed onboarding
    op.execute("UPDATE users SET onboarding_completed = true")


def downgrade() -> None:
    op.drop_column("organizations", "phone")
    op.drop_column("organizations", "size")
    op.drop_column("users", "onboarding_completed")
    op.drop_column("users", "country")
    op.drop_column("users", "phone")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
