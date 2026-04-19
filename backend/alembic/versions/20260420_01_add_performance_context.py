"""add performance context

Revision ID: 20260420_01
Revises: 20260419_02
Create Date: 2026-04-20 08:32:25.329480

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '20260420_01'
down_revision: Union[str, None] = '20260419_02'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. performance_context_items
    op.create_table(
        "performance_context_items",
        sa.Column("profile_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("linked_work_experience_id", sa.UUID(), nullable=True),
        sa.Column("linked_project_id", sa.UUID(), nullable=True),
        sa.Column("linked_achievement_ids", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("dimension_hints_json", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("priority", sa.String(length=32), nullable=False, server_default="medium"),
        sa.Column("start_date", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("target_date", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["career_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["linked_work_experience_id"], ["work_experiences.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["linked_project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_performance_context_items_profile_id",
        "performance_context_items",
        ["profile_id"],
        unique=False,
    )

    # 2. performance_tasks
    op.create_table(
        "performance_tasks",
        sa.Column("context_item_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="todo"),
        sa.Column("due_date", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["context_item_id"], ["performance_context_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_performance_tasks_context_item_id",
        "performance_tasks",
        ["context_item_id"],
        unique=False,
    )

    # 3. performance_progress_entries
    op.create_table(
        "performance_progress_entries",
        sa.Column("context_item_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("details_markdown", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="logged"),
        sa.Column("result_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("metrics_json", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("linked_project_id", sa.UUID(), nullable=True),
        sa.Column("linked_achievement_ids", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("dimension_evidence_json", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("occurred_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("clock_timestamp()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["context_item_id"], ["performance_context_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["linked_project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_performance_progress_entries_context_item_id",
        "performance_progress_entries",
        ["context_item_id"],
        unique=False,
    )


def downgrade() -> None:
    # 3. performance_progress_entries
    op.drop_index(
        "ix_performance_progress_entries_context_item_id",
        table_name="performance_progress_entries",
    )
    op.drop_table("performance_progress_entries")

    # 2. performance_tasks
    op.drop_index(
        "ix_performance_tasks_context_item_id",
        table_name="performance_tasks",
    )
    op.drop_table("performance_tasks")

    # 1. performance_context_items
    op.drop_index(
        "ix_performance_context_items_profile_id",
        table_name="performance_context_items",
    )
    op.drop_table("performance_context_items")
