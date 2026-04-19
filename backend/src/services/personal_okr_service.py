from __future__ import annotations

import json
import logging
import uuid
from datetime import UTC, datetime
from typing import Optional, List, Dict, Any

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.llm import get_llm
from src.models.personal_okr import PersonalObjective, PersonalKeyResult
from src.models.profile import CareerProfile
from src.models.capability_assessment import CapabilityAssessmentSnapshot
from src.models.coach_context import PerformanceContextItem, PerformanceTask
from src.schemas.personal_okr import (
    PersonalObjectiveCreate, PersonalObjectiveUpdate, PersonalObjectiveResponse,
    PersonalKeyResultCreate, PersonalKeyResultUpdate, PersonalKeyResultResponse,
    WeeklyActionSuggestionsResponse, WeeklyActionSuggestion
)
from src.prompts.personal_okr import render_weekly_action_suggestion_prompt

logger = logging.getLogger(__name__)

async def _get_profile_id(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID) -> uuid.UUID | None:
    stmt = select(CareerProfile.id).where(
        CareerProfile.user_id == user_id,
        CareerProfile.workspace_id == workspace_id
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()

def _kr_to_response(kr: PersonalKeyResult) -> PersonalKeyResultResponse:
    return PersonalKeyResultResponse.model_validate(kr)

def _obj_to_response(obj: PersonalObjective) -> PersonalObjectiveResponse:
    return PersonalObjectiveResponse.model_validate(obj)

# Objective CRUD
async def create_objective(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID, data: PersonalObjectiveCreate) -> PersonalObjectiveResponse | None:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return None
    
    obj = PersonalObjective(
        profile_id=profile_id,
        **data.model_dump()
    )
    session.add(obj)
    await session.flush()
    await session.refresh(obj)
    return await get_objective(session, user_id, workspace_id, obj.id)

async def get_objective(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID, objective_id: uuid.UUID) -> PersonalObjectiveResponse | None:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return None
    
    stmt = (
        select(PersonalObjective)
        .where(PersonalObjective.id == objective_id, PersonalObjective.profile_id == profile_id)
        .options(selectinload(PersonalObjective.key_results))
    )
    result = await session.execute(stmt)
    obj = result.scalar_one_or_none()
    if not obj:
        return None
    return _obj_to_response(obj)

async def list_objectives(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID) -> list[PersonalObjectiveResponse]:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return []
    
    stmt = (
        select(PersonalObjective)
        .where(PersonalObjective.profile_id == profile_id)
        .options(selectinload(PersonalObjective.key_results))
        .order_by(PersonalObjective.created_at.desc())
    )
    result = await session.execute(stmt)
    objs = result.scalars().all()
    return [_obj_to_response(o) for o in objs]

async def update_objective(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID, objective_id: uuid.UUID, data: PersonalObjectiveUpdate) -> PersonalObjectiveResponse | None:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return None
    
    stmt = select(PersonalObjective).where(PersonalObjective.id == objective_id, PersonalObjective.profile_id == profile_id)
    result = await session.execute(stmt)
    obj = result.scalar_one_or_none()
    if not obj:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(obj, field, value)
    
    obj.updated_at = datetime.now(UTC)
    await session.flush()
    return await get_objective(session, user_id, workspace_id, objective_id)

async def delete_objective(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID, objective_id: uuid.UUID) -> bool:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return False
    
    stmt = select(PersonalObjective).where(PersonalObjective.id == objective_id, PersonalObjective.profile_id == profile_id)
    result = await session.execute(stmt)
    obj = result.scalar_one_or_none()
    if not obj:
        return False
    
    await session.delete(obj)
    await session.flush()
    return True

# Key Result CRUD
async def create_key_result(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID, objective_id: uuid.UUID, data: PersonalKeyResultCreate) -> PersonalKeyResultResponse | None:
    obj_response = await get_objective(session, user_id, workspace_id, objective_id)
    if not obj_response:
        return None
    
    kr = PersonalKeyResult(
        objective_id=objective_id,
        **data.model_dump()
    )
    session.add(kr)
    await session.flush()
    await session.refresh(kr)
    return _kr_to_response(kr)

async def update_key_result(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID, kr_id: uuid.UUID, data: PersonalKeyResultUpdate) -> PersonalKeyResultResponse | None:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return None
    
    stmt = (
        select(PersonalKeyResult)
        .join(PersonalObjective)
        .where(PersonalKeyResult.id == kr_id, PersonalObjective.profile_id == profile_id)
    )
    result = await session.execute(stmt)
    kr = result.scalar_one_or_none()
    if not kr:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(kr, field, value)
    
    kr.updated_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(kr)
    return _kr_to_response(kr)

async def delete_key_result(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID, kr_id: uuid.UUID) -> bool:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return False
    
    stmt = (
        select(PersonalKeyResult)
        .join(PersonalObjective)
        .where(PersonalKeyResult.id == kr_id, PersonalObjective.profile_id == profile_id)
    )
    result = await session.execute(stmt)
    kr = result.scalar_one_or_none()
    if not kr:
        return False
    
    await session.delete(kr)
    await session.flush()
    return True

# Weekly Action Suggestion
async def suggest_weekly_actions(session: AsyncSession, user_id: uuid.UUID, workspace_id: uuid.UUID) -> WeeklyActionSuggestionsResponse | None:
    profile_id = await _get_profile_id(session, user_id, workspace_id)
    if not profile_id:
        return None

    # 1. Fetch latest snapshot
    stmt_snapshot = (
        select(CapabilityAssessmentSnapshot)
        .where(CapabilityAssessmentSnapshot.profile_id == profile_id)
        .order_by(CapabilityAssessmentSnapshot.created_at.desc())
        .limit(1)
    )
    snapshot_row = (await session.execute(stmt_snapshot)).scalar_one_or_none()
    snapshot_data = {
        "core_level": snapshot_row.core_level if snapshot_row else "Unknown",
        "next_level_gaps": snapshot_row.next_level_gap_json if snapshot_row else [],
        "suggested_actions": snapshot_row.suggested_actions_json if snapshot_row else [],
    }

    # 2. Fetch active OKRs
    stmt_okr = (
        select(PersonalObjective)
        .where(PersonalObjective.profile_id == profile_id, PersonalObjective.status != "completed")
        .options(selectinload(PersonalObjective.key_results))
    )
    objectives = (await session.execute(stmt_okr)).scalars().all()

    # 3. Fetch active Performance Context
    stmt_context = (
        select(PerformanceContextItem)
        .where(PerformanceContextItem.profile_id == profile_id, PerformanceContextItem.status == "active")
        .options(selectinload(PerformanceContextItem.tasks))
    )
    performance_context = (await session.execute(stmt_context)).scalars().all()

    # 4. Use LLM
    context = {
        "snapshot": snapshot_data,
        "objectives": objectives,
        "performance_context": performance_context,
    }

    try:
        llm = get_llm("personal_okr_weekly_actions")
        prompt = render_weekly_action_suggestion_prompt(context)
        response = await llm.ainvoke(prompt)
        content = response.content
        # Extract JSON from content
        start = content.find("{")
        end = content.rfind("}") + 1
        if start != -1 and end != -1:
            content = content[start:end]

        data = json.loads(content)
        return WeeklyActionSuggestionsResponse.model_validate(data)
    except Exception as e:
        logger.exception("Failed to generate weekly action suggestions")
        return None
