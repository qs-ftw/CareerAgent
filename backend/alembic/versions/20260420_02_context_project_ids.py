"""linked_project_id -> linked_project_ids JSONB array

Revision ID: 20260420_02
Revises: 7d8b3c4310c1
Create Date: 2026-04-20 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '20260420_02'
down_revision: Union[str, None] = '7d8b3c4310c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new JSONB column
    op.add_column(
        "performance_context_items",
        sa.Column("linked_project_ids", postgresql.JSONB(), nullable=False, server_default="[]"),
    )

    # 2. Migrate data: where linked_project_id IS NOT NULL, wrap it in an array
    op.execute(
        """
        UPDATE performance_context_items
        SET linked_project_ids = jsonb_build_array(linked_project_id::text::jsonb)
        WHERE linked_project_id IS NOT NULL
        """
    )

    # 3. Drop old column and its foreign key
    op.drop_constraint(
        "performance_context_items_linked_project_id_fkey",
        "performance_context_items",
        type_="foreignkey",
    )
    op.drop_column("performance_context_items", "linked_project_id")


def downgrade() -> None:
    # 1. Re-add old column
    op.add_column(
        "performance_context_items",
        sa.Column("linked_project_id", sa.UUID(), nullable=True),
    )

    # 2. Migrate back: take the first element from the array
    op.execute(
        """
        UPDATE performance_context_items
        SET linked_project_id = (linked_project_ids->>0)::uuid
        WHERE linked_project_ids IS NOT NULL
          AND jsonb_array_length(linked_project_ids) > 0
        """
    )

    # 3. Recreate foreign key
    op.create_foreign_key(
        "performance_context_items_linked_project_id_fkey",
        "performance_context_items",
        "projects",
        ["linked_project_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 4. Drop new column
    op.drop_column("performance_context_items", "linked_project_ids")
