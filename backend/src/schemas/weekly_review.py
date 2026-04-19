from datetime import date, datetime
from typing import List, Optional, Any, Dict
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class WeeklyReviewBase(BaseModel):
    week_start: date
    week_end: date
    manager_report_markdown: str = ""
    self_reflection_markdown: str = ""
    new_evidence_json: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_next_actions_json: List[Dict[str, Any]] = Field(default_factory=list)
    assessment_snapshot_id: Optional[UUID] = None

class WeeklyReviewCreate(WeeklyReviewBase):
    pass

class WeeklyReviewUpdate(BaseModel):
    manager_report_markdown: Optional[str] = None
    self_reflection_markdown: Optional[str] = None
    new_evidence_json: Optional[List[Dict[str, Any]]] = None
    suggested_next_actions_json: Optional[List[Dict[str, Any]]] = None
    assessment_snapshot_id: Optional[UUID] = None

class WeeklyReviewResponse(WeeklyReviewBase):
    id: UUID
    profile_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WeeklyReviewGenerateRequest(BaseModel):
    week_start: date
    week_end: date
