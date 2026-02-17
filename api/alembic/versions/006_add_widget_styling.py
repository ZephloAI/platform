"""Add widget styling columns to chatbots table.

Revision ID: 006
Revises: 005
Create Date: 2026-02-16 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("chatbots", sa.Column("widget_logo_url", sa.String(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_width", sa.Integer(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_height", sa.Integer(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_header_color", sa.String(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_user_bubble_color", sa.String(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_assistant_bubble_color", sa.String(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_font_family", sa.String(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_font_size", sa.Integer(), nullable=True))
    op.add_column("chatbots", sa.Column("widget_text_color", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("chatbots", "widget_text_color")
    op.drop_column("chatbots", "widget_font_size")
    op.drop_column("chatbots", "widget_font_family")
    op.drop_column("chatbots", "widget_assistant_bubble_color")
    op.drop_column("chatbots", "widget_user_bubble_color")
    op.drop_column("chatbots", "widget_header_color")
    op.drop_column("chatbots", "widget_height")
    op.drop_column("chatbots", "widget_width")
    op.drop_column("chatbots", "widget_logo_url")
