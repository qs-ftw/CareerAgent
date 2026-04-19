"""Capability assessment snapshot model."""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import CommonBase


class CapabilityAssessmentSnapshot(CommonBase):
    __tablename__ = "capability_assessment_snapshots"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessment_scope: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    core_level: Mapped[str] = mapped_column(String(32), nullable=False, default="未证明")
    core_reasoning_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    dimension_levels_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    evidence_links_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    next_level_gap_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    suggested_actions_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="completed")
