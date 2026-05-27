"""Add llm_model to chatbots.

Lets a platform admin pick the LLM model per agent. NULL means the agent
uses the global LLM_MODEL default, so existing rows keep their current behavior.

Revision ID: 031
Revises: 030
Create Date: 2026-05-26
"""

import sqlalchemy as sa
from alembic import op


revision = "031"
down_revision = "030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("llm_model", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "llm_model")
