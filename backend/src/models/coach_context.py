"""Performance Coach Context models."""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import CommonBase


class PerformanceContextItem(CommonBase):
    __tablename__ = "performance_context_items"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    
    linked_work_experience_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("work_experiences.id", ondelete="SET NULL"),
        nullable=True,
    )
    linked_project_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    linked_achievement_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    dimension_hints_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    
    priority: Mapped[str] = mapped_column(String(32), nullable=False, default="medium")
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    target_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    tasks: Mapped[list["PerformanceTask"]] = relationship(
        "PerformanceTask",
        back_populates="context_item",
        cascade="all, delete-orphan",
    )
    progress_entries: Mapped[list["PerformanceProgressEntry"]] = relationship(
        "PerformanceProgressEntry",
        back_populates="context_item",
        cascade="all, delete-orphan",
    )


class PerformanceTask(CommonBase):
    __tablename__ = "performance_tasks"

    context_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("performance_context_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="todo")
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationship
    context_item: Mapped["PerformanceContextItem"] = relationship(
        "PerformanceContextItem",
        back_populates="tasks",
    )


class PerformanceProgressEntry(CommonBase):
    __tablename__ = "performance_progress_entries"

    context_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("performance_context_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    details_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="logged")
    result_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    metrics_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    
    linked_project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
    )
    linked_achievement_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    dimension_evidence_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationship
    context_item: Mapped["PerformanceContextItem"] = relationship(
        "PerformanceContextItem",
        back_populates="progress_entries",
    )
