"""Personal OKR models."""

import uuid
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import CommonBase


class PersonalObjective(CommonBase):
    __tablename__ = "personal_objectives"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    target_core_level: Mapped[str | None] = mapped_column(String(64), nullable=True)
    linked_dimensions_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Relationship to Key Results
    key_results: Mapped[list["PersonalKeyResult"]] = relationship(
        "PersonalKeyResult",
        back_populates="objective",
        cascade="all, delete-orphan",
    )


class PersonalKeyResult(CommonBase):
    __tablename__ = "personal_key_results"

    objective_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("personal_objectives.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    result_definition: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    progress_value_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    
    # These are lists of UUIDs referring to performance_context_items and achievements
    linked_context_item_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    linked_evidence_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Relationship to Objective
    objective: Mapped["PersonalObjective"] = relationship(
        "PersonalObjective",
        back_populates="key_results",
    )
