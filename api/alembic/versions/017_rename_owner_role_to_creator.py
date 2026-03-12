"""Rename organization member role 'owner' to 'creator'.

Revision ID: 017
Revises: 016
Create Date: 2026-03-12 00:00:00.000000
"""

from alembic import op

revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE organization_members
        SET role = 'creator'
        WHERE role = 'owner'
    """)


def downgrade() -> None:
    op.execute("""
        UPDATE organization_members
        SET role = 'owner'
        WHERE role = 'creator'
    """)
