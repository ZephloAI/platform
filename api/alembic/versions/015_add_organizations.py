"""Add organizations, organization_members, invitations tables.

Assigns each existing user a default organization and migrates their
chatbots and API keys to that organization.

Revision ID: 015
Revises: 014
Create Date: 2026-03-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create organizations table
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("slug", sa.String(), unique=True, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("created_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
    )

    # 2. Create organization_members table
    op.create_table(
        "organization_members",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.String(), nullable=False, server_default="member"),
        sa.Column("joined_at", sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_org_user"),
    )

    # 3. Create invitations table
    op.create_table(
        "invitations",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default="member"),
        sa.Column("token", sa.String(), unique=True, nullable=False, index=True),
        sa.Column("invited_by_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
    )

    # 4. Add nullable organization_id to chatbots and api_keys
    op.add_column(
        "chatbots",
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id"), nullable=True),
    )
    op.add_column(
        "api_keys",
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id"), nullable=True),
    )

    # 5. Make api_keys.chatbot_id nullable
    op.alter_column("api_keys", "chatbot_id", existing_type=sa.Integer(), nullable=True)

    # 6. Data migration: create a default org for each user
    op.execute("""
        INSERT INTO organizations (name, slug, created_by_id)
        SELECT
            email || '''s Organization',
            'org-' || CAST(id AS TEXT),
            id
        FROM users
    """)

    # Add each user as creator of their default org
    op.execute("""
        INSERT INTO organization_members (organization_id, user_id, role)
        SELECT o.id, o.created_by_id, 'creator'
        FROM organizations o
    """)

    # Reassign chatbots to user's default org
    op.execute("""
        UPDATE chatbots
        SET organization_id = o.id
        FROM organizations o
        WHERE chatbots.user_id = o.created_by_id
    """)

    # Reassign api_keys to the org of the chatbot they belong to
    op.execute("""
        UPDATE api_keys
        SET organization_id = c.organization_id
        FROM chatbots c
        WHERE api_keys.chatbot_id = c.id
    """)

    # 7. Make organization_id NOT NULL on chatbots and api_keys
    op.alter_column("chatbots", "organization_id", existing_type=sa.Integer(), nullable=False)
    op.alter_column("api_keys", "organization_id", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    # Make organization_id nullable again before dropping
    op.alter_column("api_keys", "organization_id", existing_type=sa.Integer(), nullable=True)
    op.alter_column("chatbots", "organization_id", existing_type=sa.Integer(), nullable=True)

    # Make chatbot_id NOT NULL again
    op.alter_column("api_keys", "chatbot_id", existing_type=sa.Integer(), nullable=False)

    # Drop columns
    op.drop_column("api_keys", "organization_id")
    op.drop_column("chatbots", "organization_id")

    # Drop tables in reverse order
    op.drop_table("invitations")
    op.drop_table("organization_members")
    op.drop_table("organizations")
