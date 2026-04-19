from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from uuid import UUID

class PerformanceContextItemBase(BaseModel):
    title: str
    summary: str = ""
    status: str = "active"
    linked_work_experience_id: Optional[UUID] = None
    linked_project_ids: List[UUID] = Field(default_factory=list)
    linked_achievement_ids: List[UUID] = Field(default_factory=list)
    dimension_hints_json: Dict[str, Any] = Field(default_factory=dict)
    priority: str = "medium"
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None

class PerformanceContextItemCreate(PerformanceContextItemBase):
    pass

class PerformanceContextItemUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    linked_work_experience_id: Optional[UUID] = None
    linked_project_ids: Optional[List[UUID]] = None
    linked_achievement_ids: Optional[List[UUID]] = None
    dimension_hints_json: Optional[Dict[str, Any]] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None

class PerformanceContextItemResponse(PerformanceContextItemBase):
    id: UUID
    profile_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PerformanceTaskBase(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"
    due_date: Optional[datetime] = None
    sort_order: int = 0

class PerformanceTaskCreate(PerformanceTaskBase):
    pass

class PerformanceTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    sort_order: Optional[int] = None

class PerformanceTaskResponse(PerformanceTaskBase):
    id: UUID
    context_item_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PerformanceProgressEntryBase(BaseModel):
    title: str
    details_markdown: str = ""
    status: str = "logged"
    result_summary: str = ""
    metrics_json: Dict[str, Any] = Field(default_factory=dict)
    linked_project_id: Optional[UUID] = None
    linked_achievement_ids: List[UUID] = Field(default_factory=list)
    dimension_evidence_json: Dict[str, Any] = Field(default_factory=dict)
    occurred_at: Optional[datetime] = None

class PerformanceProgressEntryCreate(PerformanceProgressEntryBase):
    pass

class PerformanceProgressEntryUpdate(BaseModel):
    title: Optional[str] = None
    details_markdown: Optional[str] = None
    status: Optional[str] = None
    result_summary: Optional[str] = None
    metrics_json: Optional[Dict[str, Any]] = None
    linked_project_id: Optional[UUID] = None
    linked_achievement_ids: Optional[List[UUID]] = None
    dimension_evidence_json: Optional[Dict[str, Any]] = None
    occurred_at: Optional[datetime] = None

class PerformanceProgressEntryResponse(PerformanceProgressEntryBase):
    id: UUID
    context_item_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
