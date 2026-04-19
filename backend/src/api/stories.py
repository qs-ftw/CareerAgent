"""Interview story endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user_id, get_current_workspace_id
from src.schemas.story import (
    StoryBatchImport,
    StoryConsultRequest,
    StoryConsultResponse,
    StoryCreate,
    StoryListResponse,
    StoryResponse,
    StoryUpdate,
)
from src.services import story_service

router = APIRouter(prefix="/stories", tags=["stories"])


@router.get(
    "",
    response_model=StoryListResponse,
    summary="List interview stories",
)
async def list_stories(
    theme: str | None = Query(default=None, description="Filter by theme"),
    resume_id: uuid.UUID | None = Query(default=None, description="Filter by resume context"),
    db: AsyncSession = Depends(get_db),
) -> StoryListResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    items = await story_service.list_stories(
        db, user_id, workspace_id=workspace_id, theme=theme, resume_id=resume_id
    )
    return StoryListResponse(items=items, total=len(items))


@router.post(
    "",
    response_model=StoryResponse,
    summary="Create a new interview story",
)
async def create_story(
    body: StoryCreate,
    db: AsyncSession = Depends(get_db),
) -> StoryResponse:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await story_service.create_story(db, user_id, workspace_id, body)


@router.get(
    "/{story_id}",
    response_model=StoryResponse,
    summary="Get an interview story",
)
async def get_story(
    story_id: uuid.UUID = Path(..., description="The story UUID"),
    resume_id: uuid.UUID | None = Query(default=None, description="Optional resume context"),
    db: AsyncSession = Depends(get_db),
) -> StoryResponse:
    user_id = await get_current_user_id()
    story = await story_service.get_story(db, user_id, story_id, resume_id=resume_id)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@router.post(
    "/{story_id}/consult",
    response_model=StoryConsultResponse,
    summary="Get AI feedback on a story",
)
async def consult_story(
    body: StoryConsultRequest,
    story_id: uuid.UUID = Path(..., description="The story UUID"),
    db: AsyncSession = Depends(get_db),
) -> StoryConsultResponse:
    user_id = await get_current_user_id()
    feedback = await story_service.consult_story(
        db, user_id, story_id, user_message=body.user_message, resume_id=body.resume_id
    )
    return StoryConsultResponse(feedback=feedback)


@router.post(
    "/{story_id}/autopilot",
    response_model=StoryResponse,
    summary="Generate a story draft using AI",
)
async def autopilot_story(
    story_id: uuid.UUID = Path(..., description="The story UUID"),
    resume_id: uuid.UUID | None = Query(default=None, description="Optional resume context"),
    db: AsyncSession = Depends(get_db),
) -> StoryResponse:
    user_id = await get_current_user_id()
    story = await story_service.autopilot_story(db, user_id, story_id, resume_id=resume_id)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@router.post(
    "/batch-import",
    response_model=list[StoryResponse],
    summary="Batch import interview questions",
)
async def batch_import(
    body: StoryBatchImport,
    db: AsyncSession = Depends(get_db),
) -> list[StoryResponse]:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await story_service.batch_import_stories(
        db, user_id, workspace_id, body.questions
    )


@router.post(
    "/rebuild/{achievement_id}",
    response_model=list[StoryResponse],
    summary="Rebuild stories from an achievement",
)
async def rebuild_stories(
    achievement_id: uuid.UUID = Path(..., description="The achievement UUID"),
    db: AsyncSession = Depends(get_db),
) -> list[StoryResponse]:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    stories = await story_service.rebuild_from_achievement(
        db, user_id, workspace_id, achievement_id
    )
    return stories


@router.patch(
    "/{story_id}",
    response_model=StoryResponse,
    summary="Update an interview story",
)
async def update_story(
    body: StoryUpdate,
    story_id: uuid.UUID = Path(..., description="The story UUID"),
    db: AsyncSession = Depends(get_db),
) -> StoryResponse:
    user_id = await get_current_user_id()
    story = await story_service.update_story(db, user_id, story_id, body)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return story
