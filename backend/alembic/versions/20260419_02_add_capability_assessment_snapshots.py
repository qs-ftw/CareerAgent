"""Add capability assessment snapshots.

Revision ID: 20260419_02
Revises: 20260417_01
Create Date: 2026-04-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260419_02"
down_revision = "da4e1c07ff30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "capability_assessment_snapshots",
        sa.Column("profile_id", sa.UUID(), nullable=False),
        sa.Column("assessment_scope", sa.String(length=32), nullable=False, server_default="manual"),
        sa.Column("core_level", sa.String(length=32), nullable=False, server_default="未证明"),
        sa.Column("core_reasoning_markdown", sa.Text(), nullable=False, server_default=""),
        sa.Column("dimension_levels_json", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("evidence_links_json", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("next_level_gap_json", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("suggested_actions_json", postgresql.JSONB(), nullable=False, server_default="[]"),
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
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_capability_assessment_snapshots_profile_id",
        "capability_assessment_snapshots",
        ["profile_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_capability_assessment_snapshots_profile_id",
        table_name="capability_assessment_snapshots",
    )
    op.drop_table("capability_assessment_snapshots")
