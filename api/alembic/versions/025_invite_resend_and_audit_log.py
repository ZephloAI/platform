"""Extend invitations for Resend sends and add audit_logs table.

Adds columns to invitations for tracking resend attempts and acceptance
details, and creates a new audit_logs table for organization-scoped
append-only event records.

Revision ID: 025
Revises: 024
Create Date: 2026-04-23
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


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

    # --- audit_logs: new table ---
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "actor_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("event_type", sa.String(), nullable=False, index=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            index=True,
        ),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")

    op.drop_column("invitations", "accepted_by_user_id")
    op.drop_column("invitations", "accepted_at")
    op.drop_column("invitations", "last_sent_at")
    op.drop_column("invitations", "send_count")
