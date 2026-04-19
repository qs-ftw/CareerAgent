from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from uuid import UUID

class PersonalKeyResultBase(BaseModel):
    title: str
    result_definition: str = ""
    status: str = "active"
    progress_value_json: Dict[str, Any] = Field(default_factory=dict)
    linked_context_item_ids: List[UUID] = Field(default_factory=list)
    linked_evidence_ids: List[UUID] = Field(default_factory=list)

class PersonalKeyResultCreate(PersonalKeyResultBase):
    pass

class PersonalKeyResultUpdate(BaseModel):
    title: Optional[str] = None
    result_definition: Optional[str] = None
    status: Optional[str] = None
    progress_value_json: Optional[Dict[str, Any]] = None
    linked_context_item_ids: Optional[List[UUID]] = None
    linked_evidence_ids: Optional[List[UUID]] = None

class PersonalKeyResultResponse(PersonalKeyResultBase):
    id: UUID
    objective_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PersonalObjectiveBase(BaseModel):
    title: str
    summary: str = ""
    status: str = "draft"
    target_core_level: Optional[str] = None
    linked_dimensions_json: List[str] = Field(default_factory=list)

class PersonalObjectiveCreate(PersonalObjectiveBase):
    pass

class PersonalObjectiveUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    target_core_level: Optional[str] = None
    linked_dimensions_json: Optional[List[str]] = None

class PersonalObjectiveResponse(PersonalObjectiveBase):
    id: UUID
    profile_id: UUID
    key_results: List[PersonalKeyResultResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeeklyActionSuggestion(BaseModel):
    title: str
    description: str
    priority: str  # high, medium, low
    related_okr_id: Optional[UUID] = None
    related_kr_id: Optional[UUID] = None

class WeeklyActionSuggestionsResponse(BaseModel):
    suggestions: List[WeeklyActionSuggestion]
    reasoning: str
