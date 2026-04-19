from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class KnowledgeDomainCreate(BaseModel):
    name: str = Field(..., max_length=255)
    tags_json: list[str] = Field(default_factory=list)


class KnowledgeDomainUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    tags_json: list[str] | None = None


class KnowledgeDomainResponse(BaseModel):
    id: uuid.UUID
    name: str
    tags_json: list[str] = Field(default_factory=list)
    question_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeQuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=1)
    answer_markdown: str | None = ""


class KnowledgeQuestionUpdate(BaseModel):
    answer_markdown: str | None = None
    is_pinned: bool | None = None
    sort_order: int | None = None


class KnowledgeQuestionResponse(BaseModel):
    id: uuid.UUID
    domain_id: uuid.UUID
    question_text: str
    answer_markdown: str | None = ""
    is_pinned: bool = False
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResumeDomainLinkRequest(BaseModel):
    domain_ids: list[uuid.UUID]
