"""Extend invitations for Resend sends and tracking.

Adds columns to invitations for tracking resend attempts and acceptance
details. The audit_logs table originally created here has been moved to
migration 027_add_admin_limits, which owns the canonical schema shared
across the invite, admin, and usage-limit streams.

Revision ID: 025
Revises: 024
Create Date: 2026-04-23
"""

from alembic import op
import sqlalchemy as sa


revision = "025"
down_revision = "024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- invitations: tracking columns for resend + acceptance ---
    op.add_column(
        "invitations",
        sa.Column(
            "send_count",
            sa.Integer(),
            nullable=False,
            server_default="1",
        ),
    )
    op.add_column(
        "invitations",
        sa.Column("last_sent_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "invitations",
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "invitations",
        sa.Column(
            "accepted_by_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("invitations", "accepted_by_user_id")
    op.drop_column("invitations", "accepted_at")
    op.drop_column("invitations", "last_sent_at")
    op.drop_column("invitations", "send_count")
