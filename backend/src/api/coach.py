"""Coach assessment endpoints."""

from __future__ import annotations

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db, AsyncSessionLocal
from src.core.security import get_current_user_id, get_current_workspace_id
from src.schemas.coach import CapabilityAssessmentResponse
from src.schemas.coach_context import (
    PerformanceContextItemCreate,
    PerformanceContextItemUpdate,
    PerformanceContextItemResponse,
    PerformanceTaskCreate,
    PerformanceTaskUpdate,
    PerformanceTaskResponse,
    PerformanceProgressEntryCreate,
    PerformanceProgressEntryUpdate,
    PerformanceProgressEntryResponse,
)
from src.schemas.personal_okr import (
    PersonalObjectiveCreate,
    PersonalObjectiveUpdate,
    PersonalObjectiveResponse,
    PersonalKeyResultCreate,
    PersonalKeyResultUpdate,
    PersonalKeyResultResponse,
    WeeklyActionSuggestionsResponse,
)
from src.schemas.weekly_review import (
    WeeklyReviewResponse,
    WeeklyReviewGenerateRequest,
)
from src.services import (
    coach_service,
    coach_context_service,
    profile_service,
    personal_okr_service,
    weekly_review_service,
)

router = APIRouter(prefix="/coach", tags=["coach"])


@router.get("/assessment/latest", response_model=CapabilityAssessmentResponse | None)
async def get_latest_assessment(
    db: AsyncSession = Depends(get_db),
) -> CapabilityAssessmentResponse | None:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await coach_service.get_latest_assessment(db, user_id, workspace_id)


@router.get("/assessments", response_model=list[CapabilityAssessmentResponse])
async def list_assessments(
    db: AsyncSession = Depends(get_db),
) -> list[CapabilityAssessmentResponse]:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await coach_service.list_assessments(db, user_id, workspace_id)


@router.post("/assessment/refresh", response_model=CapabilityAssessmentResponse | None)
async def refresh_assessment(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> CapabilityAssessmentResponse | None:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    
    # Initialize pending snapshot
    snapshot = await coach_service.refresh_assessment(db, user_id, workspace_id)
    if not snapshot:
        return None
        
    # Trigger background evaluation
    background_tasks.add_task(
        coach_service.run_assessment_in_background,
        AsyncSessionLocal,
        snapshot.profile_id,
        user_id,
        workspace_id,
        snapshot.id
    )
    
    return snapshot


# Coach Context Item Endpoints

@router.get("/context-items", response_model=List[PerformanceContextItemResponse])
async def get_context_items(
    db: AsyncSession = Depends(get_db),
) -> List[PerformanceContextItemResponse]:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    profile = await profile_service.get_profile(db, user_id, workspace_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return await coach_context_service.get_context_items_for_profile(db, profile.id)


@router.post("/context-items", response_model=PerformanceContextItemResponse, status_code=status.HTTP_201_CREATED)
async def create_context_item(
    item_in: PerformanceContextItemCreate,
    db: AsyncSession = Depends(get_db),
) -> PerformanceContextItemResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    profile = await profile_service.get_profile(db, user_id, workspace_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return await coach_context_service.create_context_item(db, profile.id, item_in)


@router.patch("/context-items/{item_id}", response_model=PerformanceContextItemResponse)
async def update_context_item(
    item_id: UUID,
    item_in: PerformanceContextItemUpdate,
    db: AsyncSession = Depends(get_db),
) -> PerformanceContextItemResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    profile = await profile_service.get_profile(db, user_id, workspace_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    result = await coach_context_service.update_context_item(db, profile.id, item_id, item_in)
    if not result:
        raise HTTPException(status_code=404, detail="Context item not found")
    return result


# Task Endpoints

@router.get("/context-items/{item_id}/tasks", response_model=List[PerformanceTaskResponse])
async def get_tasks(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[PerformanceTaskResponse]:
    return await coach_context_service.get_tasks_for_context(db, item_id)


@router.post("/context-items/{item_id}/tasks", response_model=PerformanceTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    item_id: UUID,
    task_in: PerformanceTaskCreate,
    db: AsyncSession = Depends(get_db),
) -> PerformanceTaskResponse:
    return await coach_context_service.create_task_for_context(db, item_id, task_in)


@router.patch("/tasks/{task_id}", response_model=PerformanceTaskResponse)
async def update_task(
    task_id: UUID,
    task_in: PerformanceTaskUpdate,
    db: AsyncSession = Depends(get_db),
) -> PerformanceTaskResponse:
    result = await coach_context_service.update_task(db, task_id, task_in)
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    return result


# Progress Entry Endpoints

@router.get("/context-items/{item_id}/progress", response_model=List[PerformanceProgressEntryResponse])
async def get_progress_entries(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[PerformanceProgressEntryResponse]:
    return await coach_context_service.get_progress_entries_for_context(db, item_id)


@router.post("/context-items/{item_id}/progress", response_model=PerformanceProgressEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_progress_entry(
    item_id: UUID,
    entry_in: PerformanceProgressEntryCreate,
    db: AsyncSession = Depends(get_db),
) -> PerformanceProgressEntryResponse:
    return await coach_context_service.create_progress_entry(db, item_id, entry_in)


@router.patch("/progress/{entry_id}", response_model=PerformanceProgressEntryResponse)
async def update_progress_entry(
    entry_id: UUID,
    entry_in: PerformanceProgressEntryUpdate,
    db: AsyncSession = Depends(get_db),
) -> PerformanceProgressEntryResponse:
    result = await coach_context_service.update_progress_entry(db, entry_id, entry_in)
    if not result:
        raise HTTPException(status_code=404, detail="Progress entry not found")
    return result


# Personal OKR Endpoints

@router.get("/okrs", response_model=List[PersonalObjectiveResponse])
async def list_okrs(
    db: AsyncSession = Depends(get_db),
) -> List[PersonalObjectiveResponse]:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await personal_okr_service.list_objectives(db, user_id, workspace_id)


@router.post("/okrs", response_model=PersonalObjectiveResponse, status_code=status.HTTP_201_CREATED)
async def create_okr(
    okr_in: PersonalObjectiveCreate,
    db: AsyncSession = Depends(get_db),
) -> PersonalObjectiveResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.create_objective(db, user_id, workspace_id, okr_in)
    if not result:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result


@router.patch("/okrs/{okr_id}", response_model=PersonalObjectiveResponse)
async def update_okr(
    okr_id: UUID,
    okr_in: PersonalObjectiveUpdate,
    db: AsyncSession = Depends(get_db),
) -> PersonalObjectiveResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.update_objective(db, user_id, workspace_id, okr_id, okr_in)
    if not result:
        raise HTTPException(status_code=404, detail="OKR not found")
    return result


@router.post("/okrs/{okr_id}/key-results", response_model=PersonalKeyResultResponse, status_code=status.HTTP_201_CREATED)
async def create_key_result(
    okr_id: UUID,
    kr_in: PersonalKeyResultCreate,
    db: AsyncSession = Depends(get_db),
) -> PersonalKeyResultResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.create_key_result(db, user_id, workspace_id, okr_id, kr_in)
    if not result:
        raise HTTPException(status_code=404, detail="OKR not found")
    return result


@router.patch("/key-results/{kr_id}", response_model=PersonalKeyResultResponse)
async def update_key_result(
    kr_id: UUID,
    kr_in: PersonalKeyResultUpdate,
    db: AsyncSession = Depends(get_db),
) -> PersonalKeyResultResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.update_key_result(db, user_id, workspace_id, kr_id, kr_in)
    if not result:
        raise HTTPException(status_code=404, detail="Key result not found")
    return result


@router.get("/weekly-actions", response_model=WeeklyActionSuggestionsResponse | None)
async def get_weekly_action_suggestions(
    db: AsyncSession = Depends(get_db),
) -> WeeklyActionSuggestionsResponse | None:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await personal_okr_service.suggest_weekly_actions(db, user_id, workspace_id)


# Weekly Review Endpoints

@router.post("/weekly-reviews/generate", response_model=WeeklyReviewResponse)
async def generate_weekly_review(
    request: WeeklyReviewGenerateRequest,
    db: AsyncSession = Depends(get_db),
) -> WeeklyReviewResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    try:
        return await weekly_review_service.generate_weekly_review(
            db, user_id, workspace_id, request.week_start, request.week_end
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/weekly-reviews", response_model=List[WeeklyReviewResponse])
async def list_weekly_reviews(
    db: AsyncSession = Depends(get_db),
) -> List[WeeklyReviewResponse]:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    profile = await profile_service.get_profile(db, user_id, workspace_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return await weekly_review_service.get_weekly_reviews(db, profile.id)


@router.get("/weekly-reviews/{review_id}", response_model=WeeklyReviewResponse)
async def get_weekly_review(
    review_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> WeeklyReviewResponse:
    review = await weekly_review_service.get_weekly_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Weekly review not found")
    return review


@router.patch("/weekly-reviews/{review_id}", response_model=WeeklyReviewResponse)
async def update_weekly_review(
    review_id: UUID,
    review_in: WeeklyReviewUpdate,
    db: AsyncSession = Depends(get_db),
) -> WeeklyReviewResponse:
    review = await weekly_review_service.update_weekly_review(db, review_id, review_in)
    if not review:
        raise HTTPException(status_code=404, detail="Weekly review not found")
    return review
