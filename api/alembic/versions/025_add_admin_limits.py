"""Admin limits + usage tracking.

Adds:
- Plan + limit columns on organizations (max_users, max_agents, max_tokens_per_period)
- Token usage aggregates on organizations (incremental counter + period start)
- is_platform_admin flag on users
- agent_token_usage table (per-call rows written by the agent service)
- audit_logs table (invite sends, limit changes, suspensions)

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
    # --- organizations: plan, suspension, limits, usage aggregates ---
    op.add_column(
        "organizations",
        sa.Column("plan", sa.String(), nullable=False, server_default="free"),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "is_suspended",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column("organizations", sa.Column("max_users", sa.Integer(), nullable=True))
    op.add_column("organizations", sa.Column("max_agents", sa.Integer(), nullable=True))
    op.add_column(
        "organizations",
        sa.Column("max_tokens_per_period", sa.BigInteger(), nullable=True),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "token_period", sa.String(), nullable=False, server_default="monthly"
        ),
    )
    op.add_column(
        "organizations",
        sa.Column("token_period_start", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "tokens_used_in_period",
            sa.BigInteger(),
            nullable=False,
            server_default="0",
        ),
    )

    # --- users: platform admin flag ---
    op.add_column(
        "users",
        sa.Column(
            "is_platform_admin",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # --- agent_token_usage ---
    op.create_table(
        "agent_token_usage",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "chatbot_id",
            sa.Integer(),
            sa.ForeignKey("chatbots.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("session_id", sa.String(), nullable=True),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column(
            "prompt_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "completion_tokens", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "total_tokens", sa.BigInteger(), nullable=False, server_default="0"
        ),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index(
        "ix_agent_token_usage_organization_id",
        "agent_token_usage",
        ["organization_id"],
    )
    op.create_index(
        "ix_agent_token_usage_chatbot_id",
        "agent_token_usage",
        ["chatbot_id"],
    )
    op.create_index(
        "ix_agent_token_usage_session_id",
        "agent_token_usage",
        ["session_id"],
    )
    op.create_index(
        "ix_agent_token_usage_created_at",
        "agent_token_usage",
        ["created_at"],
    )

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "organization_id",
            sa.Integer(),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column(
            "actor_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("target_type", sa.String(), nullable=True),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("extra", sa.JSON(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index(
        "ix_audit_logs_organization_id", "audit_logs", ["organization_id"]
    )
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_organization_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index(
        "ix_agent_token_usage_created_at", table_name="agent_token_usage"
    )
    op.drop_index(
        "ix_agent_token_usage_session_id", table_name="agent_token_usage"
    )
    op.drop_index(
        "ix_agent_token_usage_chatbot_id", table_name="agent_token_usage"
    )
    op.drop_index(
        "ix_agent_token_usage_organization_id", table_name="agent_token_usage"
    )
    op.drop_table("agent_token_usage")

    op.drop_column("users", "is_platform_admin")

    op.drop_column("organizations", "tokens_used_in_period")
    op.drop_column("organizations", "token_period_start")
    op.drop_column("organizations", "token_period")
    op.drop_column("organizations", "max_tokens_per_period")
    op.drop_column("organizations", "max_agents")
    op.drop_column("organizations", "max_users")
    op.drop_column("organizations", "is_suspended")
    op.drop_column("organizations", "plan")
