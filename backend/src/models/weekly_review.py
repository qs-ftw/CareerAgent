"""Weekly Review model."""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import CommonBase


class WeeklyReviewRun(CommonBase):
    """Represents a weekly performance review and reflection run."""

    __tablename__ = "weekly_review_runs"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    manager_report_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    self_reflection_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    new_evidence_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    suggested_next_actions_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    assessment_snapshot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("capability_assessment_snapshots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
