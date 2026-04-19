"""Personal OKR endpoints — objectives and key results CRUD."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user_id, get_current_workspace_id
from src.schemas.personal_okr import (
    PersonalObjectiveCreate,
    PersonalObjectiveUpdate,
    PersonalObjectiveResponse,
    PersonalKeyResultCreate,
    PersonalKeyResultUpdate,
    PersonalKeyResultResponse,
    WeeklyActionSuggestionsResponse,
)
from src.services import personal_okr_service

router = APIRouter(prefix="/okr", tags=["okr"])


# ── Objectives ──────────────────────────────────────────────


@router.get("/objectives", response_model=list[PersonalObjectiveResponse])
async def list_objectives(
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await personal_okr_service.list_objectives(db, user_id, workspace_id)


@router.get("/objectives/{objective_id}", response_model=PersonalObjectiveResponse | None)
async def get_objective(
    objective_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.get_objective(db, user_id, workspace_id, objective_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Objective not found")
    return result


@router.post("/objectives", response_model=PersonalObjectiveResponse, status_code=status.HTTP_201_CREATED)
async def create_objective(
    body: PersonalObjectiveCreate,
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.create_objective(db, user_id, workspace_id, body)
    if result is None:
        raise HTTPException(status_code=404, detail="Career profile not found")
    return result


@router.patch("/objectives/{objective_id}", response_model=PersonalObjectiveResponse)
async def update_objective(
    objective_id: UUID,
    body: PersonalObjectiveUpdate,
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.update_objective(db, user_id, workspace_id, objective_id, body)
    if result is None:
        raise HTTPException(status_code=404, detail="Objective not found")
    return result


@router.delete("/objectives/{objective_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_objective(
    objective_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    deleted = await personal_okr_service.delete_objective(db, user_id, workspace_id, objective_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Objective not found")


# ── Key Results ─────────────────────────────────────────────


@router.post("/objectives/{objective_id}/key-results", response_model=PersonalKeyResultResponse, status_code=status.HTTP_201_CREATED)
async def create_key_result(
    objective_id: UUID,
    body: PersonalKeyResultCreate,
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.create_key_result(db, user_id, workspace_id, objective_id, body)
    if result is None:
        raise HTTPException(status_code=404, detail="Objective not found")
    return result


@router.patch("/key-results/{kr_id}", response_model=PersonalKeyResultResponse)
async def update_key_result(
    kr_id: UUID,
    body: PersonalKeyResultUpdate,
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    result = await personal_okr_service.update_key_result(db, user_id, workspace_id, kr_id, body)
    if result is None:
        raise HTTPException(status_code=404, detail="Key result not found")
    return result


@router.delete("/key-results/{kr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key_result(
    kr_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    deleted = await personal_okr_service.delete_key_result(db, user_id, workspace_id, kr_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Key result not found")


# ── Weekly Suggestions ──────────────────────────────────────


@router.post("/weekly-suggestions", response_model=WeeklyActionSuggestionsResponse | None)
async def get_weekly_suggestions(
    db: AsyncSession = Depends(get_db),
):
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await personal_okr_service.suggest_weekly_actions(db, user_id, workspace_id)
