from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class StoryCreate(BaseModel):
    """Request body for creating an interview story."""

    question_text: str = Field(..., min_length=1)
    answer_markdown: str | None = Field(default="")
    theme: str = Field(default="general", max_length=128)
    status: str = Field(default="empty", max_length=32)
    linked_achievement_ids: list[UUID] = Field(default_factory=list)
    analysis_chat: list[dict[str, Any]] = Field(default_factory=list)
    star_summary: dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = Field(default=0.0, ge=0.0)


class StoryUpdate(BaseModel):
    """Request body for updating an interview story. All fields optional."""

    question_text: str | None = Field(default=None, min_length=1)
    answer_markdown: str | None = None
    theme: str | None = Field(default=None, max_length=128)
    status: str | None = Field(default=None, max_length=32)
    linked_achievement_ids: list[UUID] | None = None
    analysis_chat: list[dict[str, Any]] | None = None
    star_summary: dict[str, Any] | None = None
    confidence_score: float | None = Field(default=None, ge=0.0)
    resume_id: UUID | None = Field(default=None, description="Optional resume context")


class StoryResponse(BaseModel):
    """Full interview story detail."""

    id: UUID
    question_text: str
    answer_markdown: str | None
    theme: str
    status: str
    linked_achievement_ids: list[UUID]
    analysis_chat: list[dict[str, Any]]
    star_summary: dict[str, Any]
    confidence_score: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StoryBatchImport(BaseModel):
    """Request body for batch importing interview questions."""

    questions: list[str] = Field(..., min_items=1)


class StoryListResponse(BaseModel):
    items: list[StoryResponse]
    total: int = 0


class StoryConsultRequest(BaseModel):
    """Request body for story consultation."""

    user_message: str | None = Field(default=None, description="Optional user message/context")
    resume_id: UUID | None = Field(default=None, description="Optional resume context")


class StoryConsultResponse(BaseModel):
    """Response from story consultation."""

    feedback: str
