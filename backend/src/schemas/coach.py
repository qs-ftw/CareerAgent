"""Schemas for performance coach capability assessment snapshots."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

CapabilityDimensionKey = Literal[
    "exploration_innovation",
    "breakthrough_problem_solving",
    "execution_delivery",
    "core_backbone",
    "collaboration_influence",
]


class CapabilityDimensionAssessment(BaseModel):
    level: str = Field(default="", max_length=32)
    status: Literal["proven", "partial", "unproven"]
    summary: str = Field(default="")
    evidence_count: int = Field(default=0, ge=0)


class CapabilityEvidenceLink(BaseModel):
    source_type: str = Field(default="", max_length=64)
    source_id: UUID
    title: str = Field(default="")
    summary: str = Field(default="")
    dimensions: list[CapabilityDimensionKey] = Field(default_factory=list)


class CapabilityAssessmentPersist(BaseModel):
    assessment_scope: str = Field(default="manual", max_length=32)
    status: Literal["pending", "completed", "failed"] = Field(default="completed")
    core_level: str = Field(default="未证明", max_length=32)
    core_reasoning_markdown: str = Field(default="")
    dimension_levels: dict[CapabilityDimensionKey, CapabilityDimensionAssessment] = Field(default_factory=dict)
    evidence_links: list[CapabilityEvidenceLink] = Field(default_factory=list)
    next_level_gaps: list[str] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)


class CapabilityAssessmentResponse(CapabilityAssessmentPersist):
    id: UUID
    profile_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
