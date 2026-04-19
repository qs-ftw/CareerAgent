"""Database-backed service for performance coach capability assessments."""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from json import JSONDecodeError
from typing import get_args

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.llm import get_llm
from src.models.achievement import Achievement
from src.models.capability_assessment import CapabilityAssessmentSnapshot
from src.models.coach_context import PerformanceContextItem, PerformanceProgressEntry
from src.models.project import Project
from src.models.profile import CareerProfile
from src.models.story import InterviewStory
from src.models.work_experience import WorkExperience
from src.prompts.capability_assessment import render_capability_assessment_prompt
from src.schemas.coach import (
    CapabilityAssessmentPersist,
    CapabilityDimensionKey,
    CapabilityAssessmentResponse,
)

logger = logging.getLogger(__name__)
ALLOWED_DIMENSION_KEYS = frozenset(get_args(CapabilityDimensionKey))


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _profile_lock_key(profile_id: uuid.UUID) -> int:
    # Serialize writes for the same profile with a stable bigint advisory lock key.
    return int.from_bytes(profile_id.bytes[:8], byteorder="big", signed=True)


async def _lock_profile_snapshot_writes(
    session: AsyncSession,
    profile_id: uuid.UUID,
) -> None:
    await session.execute(
        select(func.pg_advisory_xact_lock(_profile_lock_key(profile_id)))
    )


async def _next_snapshot_created_at(
    session: AsyncSession,
    profile_id: uuid.UUID,
) -> datetime:
    candidate = _utcnow()
    stmt = (
        select(CapabilityAssessmentSnapshot.created_at)
        .where(CapabilityAssessmentSnapshot.profile_id == profile_id)
        .order_by(CapabilityAssessmentSnapshot.created_at.desc())
    )
    result = await session.execute(stmt)
    latest_created_at = result.scalars().first()
    if latest_created_at is not None and latest_created_at >= candidate:
        return latest_created_at + timedelta(microseconds=1)
    return candidate


def _to_response(row: CapabilityAssessmentSnapshot) -> CapabilityAssessmentResponse:
    dimension_levels = row.dimension_levels_json if isinstance(row.dimension_levels_json, dict) else {}
    evidence_links = row.evidence_links_json if isinstance(row.evidence_links_json, list) else []

    return CapabilityAssessmentResponse(
        id=row.id,
        profile_id=row.profile_id,
        assessment_scope=row.assessment_scope,
        status=row.status,
        core_level=row.core_level,
        core_reasoning_markdown=row.core_reasoning_markdown,
        dimension_levels={
            key: value
            for key, value in dimension_levels.items()
            if key in ALLOWED_DIMENSION_KEYS and isinstance(value, dict)
        },
        evidence_links=[
            {
                **item,
                "dimensions": [
                    dimension
                    for dimension in item.get("dimensions", [])
                    if dimension in ALLOWED_DIMENSION_KEYS
                ],
            }
            for item in evidence_links
            if isinstance(item, dict)
        ],
        next_level_gaps=row.next_level_gap_json or [],
        suggested_actions=row.suggested_actions_json or [],
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


async def _get_profile_row(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> CareerProfile | None:
    with session.no_autoflush:
        stmt = select(CareerProfile).where(
            CareerProfile.user_id == user_id,
            CareerProfile.workspace_id == workspace_id,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


def _serialize_uuid(value: uuid.UUID | None) -> str | None:
    return str(value) if value is not None else None


def _serialize_story(story: InterviewStory) -> dict:
    return {
        "id": _serialize_uuid(story.id),
        "question_text": story.question_text,
        "answer_markdown": story.answer_markdown,
        "theme": story.theme,
        "linked_achievement_ids": [str(x) for x in (story.linked_achievement_ids or [])],
        "confidence_score": story.confidence_score,
    }


def _serialize_profile(profile: CareerProfile) -> dict:
    return {
        "id": _serialize_uuid(profile.id),
        "name": profile.name,
        "headline": profile.headline,
        "professional_summary": profile.professional_summary,
        "skill_categories": dict(profile.skill_categories or {}),
    }


async def _build_existing_evidence_pack(
    session: AsyncSession,
    profile: CareerProfile,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> dict:
    with session.no_autoflush:
        # 1. Fetch Performance Context Items
        context_items_result = await session.execute(
            select(PerformanceContextItem).where(
                PerformanceContextItem.profile_id == profile.id
            )
        )
        context_items = context_items_result.scalars().all()
        
        # 2. Collect linked IDs and progress entries
        linked_project_ids = set()
        linked_achievement_ids = set()
        linked_work_experience_ids = set()
        
        serialized_context = []
        for item in context_items:
            # Context item links
            if item.linked_project_ids:
                for pid in item.linked_project_ids:
                    try:
                        linked_project_ids.add(uuid.UUID(str(pid)))
                    except (ValueError, TypeError):
                        continue
            if item.linked_achievement_ids:
                for aid in item.linked_achievement_ids:
                    try:
                        linked_achievement_ids.add(uuid.UUID(str(aid)))
                    except (ValueError, TypeError):
                        continue
            if item.linked_work_experience_id:
                linked_work_experience_ids.add(item.linked_work_experience_id)
                
            # Progress entries
            progress_entries_result = await session.execute(
                select(PerformanceProgressEntry).where(
                    PerformanceProgressEntry.context_item_id == item.id
                ).order_by(PerformanceProgressEntry.created_at.desc())
            )
            progress_entries = progress_entries_result.scalars().all()
            
            item_progress = []
            for entry in progress_entries:
                if entry.linked_project_id:
                    linked_project_ids.add(entry.linked_project_id)
                if entry.linked_achievement_ids:
                    for aid in entry.linked_achievement_ids:
                        try:
                            linked_achievement_ids.add(uuid.UUID(str(aid)))
                        except (ValueError, TypeError):
                            continue
                
                item_progress.append({
                    "id": _serialize_uuid(entry.id),
                    "title": entry.title,
                    "details_markdown": entry.details_markdown,
                    "status": entry.status,
                    "result_summary": entry.result_summary,
                    "metrics": entry.metrics_json,
                    "occurred_at": entry.occurred_at.isoformat() if entry.occurred_at else None,
                })
            
            serialized_context.append({
                "id": _serialize_uuid(item.id),
                "title": item.title,
                "summary": item.summary,
                "status": item.status,
                "priority": item.priority,
                "progress_entries": item_progress,
            })

        # 3. Expand achievement IDs to include those belonging to linked projects/experiences
        if linked_project_ids:
            proj_ach_result = await session.execute(
                select(Achievement.id).where(Achievement.project_id.in_(linked_project_ids))
            )
            linked_achievement_ids.update(proj_ach_result.scalars().all())
            
        if linked_work_experience_ids:
            we_ach_result = await session.execute(
                select(Achievement.id).where(Achievement.work_experience_id.in_(linked_work_experience_ids))
            )
            linked_achievement_ids.update(we_ach_result.scalars().all())

        # 4. Fetch the actual records
        work_experiences = []
        if linked_work_experience_ids:
            work_experiences_result = await session.execute(
                select(WorkExperience).where(
                    WorkExperience.id.in_(linked_work_experience_ids),
                ).order_by(WorkExperience.sort_order.asc(), WorkExperience.created_at.asc())
            )
            work_experiences = work_experiences_result.scalars().all()
            
        projects = []
        if linked_project_ids:
            projects_result = await session.execute(
                select(Project).where(
                    Project.id.in_(linked_project_ids),
                ).order_by(Project.sort_order.asc(), Project.created_at.asc())
            )
            projects = projects_result.scalars().all()
            
        achievements = []
        if linked_achievement_ids:
            achievements_result = await session.execute(
                select(Achievement).where(
                    Achievement.id.in_(linked_achievement_ids),
                ).order_by(Achievement.created_at.asc())
            )
            achievements = achievements_result.scalars().all()
            
        # 5. Filter stories by linked achievements
        stories = []
        if linked_achievement_ids:
            stories_result = await session.execute(
                select(InterviewStory).where(
                    InterviewStory.user_id == user_id,
                    InterviewStory.workspace_id == workspace_id,
                    InterviewStory.deleted_at.is_(None),
                ).order_by(InterviewStory.confidence_score.desc(), InterviewStory.created_at.desc())
            )
            all_stories = stories_result.scalars().all()
            for s in all_stories:
                if s.linked_achievement_ids:
                    s_aids = {uuid.UUID(str(aid)) for aid in s.linked_achievement_ids}
                    if s_aids.intersection(linked_achievement_ids):
                        stories.append(s)

    return {
        "profile_id": _serialize_uuid(profile.id),
        "user_id": _serialize_uuid(user_id),
        "workspace_id": _serialize_uuid(workspace_id),
        "profile": _serialize_profile(profile),
        "performance_context": serialized_context,
        "counts": {
            "work_experiences": len(work_experiences),
            "projects": len(projects),
            "achievements": len(achievements),
            "stories": len(stories),
            "context_items": len(context_items),
        },
        "work_experiences": [
            {
                "id": _serialize_uuid(item.id),
                "company_name": item.company_name,
                "role_title": item.role_title,
                "description": item.description,
                "start_date": item.start_date.isoformat() if item.start_date else None,
                "end_date": item.end_date.isoformat() if item.end_date else None,
                "sort_order": item.sort_order,
            }
            for item in work_experiences
        ],
        "projects": [
            {
                "id": _serialize_uuid(item.id),
                "name": item.name,
                "description": item.description,
                "tech_stack": list(item.tech_stack or []),
                "url": item.url,
                "work_experience_id": _serialize_uuid(item.work_experience_id),
                "start_date": item.start_date.isoformat() if item.start_date else None,
                "end_date": item.end_date.isoformat() if item.end_date else None,
                "sort_order": item.sort_order,
            }
            for item in projects
        ],
        "achievements": [
            {
                "id": _serialize_uuid(item.id),
                "title": item.title,
                "raw_content": item.raw_content,
                "tags": list(item.tags or []),
                "importance_score": item.importance_score,
                "source_type": item.source_type,
                "status": item.status,
                "project_id": _serialize_uuid(item.project_id),
                "work_experience_id": _serialize_uuid(item.work_experience_id),
                "date_occurred": item.date_occurred.isoformat() if item.date_occurred else None,
            }
            for item in achievements
        ],
        "stories": [_serialize_story(item) for item in stories],
    }


def _load_model_payload(content: str) -> dict:
    decoder = json.JSONDecoder()
    stripped = content.strip()

    try:
        payload = decoder.decode(stripped)
    except JSONDecodeError:
        payload = None

    if isinstance(payload, dict):
        return payload

    for index, char in enumerate(content):
        if char != "{":
            continue
        try:
            payload, _ = decoder.raw_decode(content[index:])
        except JSONDecodeError:
            continue
        if isinstance(payload, dict):
            return payload

    raise JSONDecodeError("Unable to extract JSON object from model response", content, 0)


def _validate_evidence_links(
    assessment: CapabilityAssessmentPersist,
    evidence_pack: dict,
) -> None:
    available_refs = {
        ("profile", str(profile_id))
        for profile_id in [evidence_pack.get("profile_id")]
        if profile_id
    }

    for source_type, collection_name in (
        ("work_experience", "work_experiences"),
        ("project", "projects"),
        ("achievement", "achievements"),
        ("story", "stories"),
    ):
        for item in evidence_pack.get(collection_name, []):
            if isinstance(item, dict) and item.get("id"):
                available_refs.add((source_type, item["id"]))

    invalid_links = [
        f"{link.source_type}:{link.source_id}"
        for link in assessment.evidence_links
        if (link.source_type, str(link.source_id)) not in available_refs
    ]
    if invalid_links:
        raise ValueError(
            "evidence_links contain references not present in evidence pack: "
            + ", ".join(invalid_links)
        )


async def _run_capability_model(evidence_pack: dict) -> CapabilityAssessmentPersist:
    llm = get_llm("performance_coach_assessment")
    prompt = render_capability_assessment_prompt(evidence_pack)
    response = await llm.ainvoke(prompt)
    payload = _load_model_payload(response.content)
    assessment = CapabilityAssessmentPersist.model_validate(payload)
    assessment = assessment.model_copy(update={"assessment_scope": "full_refresh"})
    _validate_evidence_links(assessment, evidence_pack)
    return assessment


def _fallback_assessment(reason: str = "no_evidence") -> CapabilityAssessmentPersist:
    if reason == "model_error":
        return CapabilityAssessmentPersist(
            assessment_scope="full_refresh",
            core_level="未证明",
            core_reasoning_markdown="本次自动评估刷新失败，已回退为保守结果；请重新触发刷新以获取正式判断。",
            dimension_levels={},
            evidence_links=[],
            next_level_gaps=["本次自动评估失败，当前结果不能作为正式晋级判断依据。"],
            suggested_actions=["重新触发一次能力评估刷新。"],
        )

    return CapabilityAssessmentPersist(
        assessment_scope="full_refresh",
        core_level="未证明",
        core_reasoning_markdown="当前证据不足，无法稳定证明核心能力层级。",
        dimension_levels={},
        evidence_links=[],
        next_level_gaps=["缺少足够的可验证证据来判断稳定交付水平。"],
        suggested_actions=["补充一条完整的、可追溯的交付闭环证据。"],
    )


def _build_ephemeral_response(
    profile_id: uuid.UUID,
    payload: CapabilityAssessmentPersist,
) -> CapabilityAssessmentResponse:
    timestamp = _utcnow()
    return CapabilityAssessmentResponse(
        id=uuid.uuid4(),
        profile_id=profile_id,
        assessment_scope=payload.assessment_scope,
        status=payload.status,
        core_level=payload.core_level,
        core_reasoning_markdown=payload.core_reasoning_markdown,
        dimension_levels=payload.dimension_levels,
        evidence_links=payload.evidence_links,
        next_level_gaps=payload.next_level_gaps,
        suggested_actions=payload.suggested_actions,
        created_at=timestamp,
        updated_at=timestamp,
    )


async def save_assessment_snapshot(
    session: AsyncSession,
    profile_id: uuid.UUID,
    payload: CapabilityAssessmentPersist,
) -> CapabilityAssessmentResponse:
    await _lock_profile_snapshot_writes(session, profile_id)
    created_at = await _next_snapshot_created_at(session, profile_id)
    row = CapabilityAssessmentSnapshot(
        profile_id=profile_id,
        assessment_scope=payload.assessment_scope,
        status=payload.status,
        core_level=payload.core_level,
        core_reasoning_markdown=payload.core_reasoning_markdown,
        dimension_levels_json={
            key: value.model_dump(mode="json") for key, value in payload.dimension_levels.items()
        },
        evidence_links_json=[item.model_dump(mode="json") for item in payload.evidence_links],
        next_level_gap_json=list(payload.next_level_gaps),
        suggested_actions_json=list(payload.suggested_actions),
        created_at=created_at,
        updated_at=created_at,
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return _to_response(row)


async def _get_latest_snapshot_row(
    session: AsyncSession,
    profile_id: uuid.UUID,
) -> CapabilityAssessmentSnapshot | None:
    stmt = (
        select(CapabilityAssessmentSnapshot)
        .where(
            CapabilityAssessmentSnapshot.profile_id == profile_id,
            CapabilityAssessmentSnapshot.deleted_at.is_(None),
        )
        .order_by(
            CapabilityAssessmentSnapshot.created_at.desc(),
            CapabilityAssessmentSnapshot.id.desc(),
        )
    )
    result = await session.execute(stmt)
    return result.scalars().first()


async def run_assessment_in_background(
    session_factory,
    profile_id: uuid.UUID,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    snapshot_id: uuid.UUID,
) -> None:
    """Background task to run the LLM assessment and update the snapshot."""
    async with session_factory() as session:
        try:
            profile = await _get_profile_row(session, user_id, workspace_id)
            if not profile:
                return

            evidence_pack = await _build_existing_evidence_pack(session, profile, user_id, workspace_id)
            if evidence_pack["counts"]["achievements"] == 0 and evidence_pack["counts"]["stories"] == 0:
                payload = _fallback_assessment(reason="no_evidence")
            else:
                try:
                    payload = await _run_capability_model(evidence_pack)
                except Exception:
                    logger.exception("Performance coach refresh background task failed because model execution failed")
                    payload = _fallback_assessment(reason="model_error")
            
            # Update the snapshot
            stmt = select(CapabilityAssessmentSnapshot).where(CapabilityAssessmentSnapshot.id == snapshot_id)
            result = await session.execute(stmt)
            snapshot = result.scalar_one_or_none()
            
            if snapshot:
                snapshot.status = "completed"
                snapshot.core_level = payload.core_level
                snapshot.core_reasoning_markdown = payload.core_reasoning_markdown
                snapshot.dimension_levels_json = {
                    key: value.model_dump(mode="json") for key, value in payload.dimension_levels.items()
                }
                snapshot.evidence_links_json = [item.model_dump(mode="json") for item in payload.evidence_links]
                snapshot.next_level_gap_json = list(payload.next_level_gaps)
                snapshot.suggested_actions_json = list(payload.suggested_actions)
                snapshot.updated_at = _utcnow()
                await session.commit()
                
        except Exception:
            logger.exception("Critical error in performance coach background assessment")
            async with session_factory() as fail_session:
                stmt = select(CapabilityAssessmentSnapshot).where(CapabilityAssessmentSnapshot.id == snapshot_id)
                result = await fail_session.execute(stmt)
                snapshot = result.scalar_one_or_none()
                if snapshot:
                    snapshot.status = "failed"
                    snapshot.core_reasoning_markdown = "评估过程中发生系统错误，请重试。"
                    snapshot.updated_at = _utcnow()
                    await fail_session.commit()


async def refresh_assessment(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> CapabilityAssessmentResponse | None:
    profile = await _get_profile_row(session, user_id, workspace_id)
    if profile is None:
        return None

    # Initialize a pending snapshot
    payload = CapabilityAssessmentPersist(
        assessment_scope="full_refresh",
        status="pending",
        core_level="评估中",
        core_reasoning_markdown="正在基于工作上下文、成果和面试作品进行深度评估，请稍候...",
    )
    
    return await save_assessment_snapshot(session, profile.id, payload)


PENDING_TIMEOUT_MINUTES = 10


async def refresh_assessment_sync(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> CapabilityAssessmentResponse | None:
    """Synchronous assessment refresh: runs the evaluation immediately and saves as completed."""
    profile = await _get_profile_row(session, user_id, workspace_id)
    if profile is None:
        return None

    evidence_pack = await _build_existing_evidence_pack(session, profile, user_id, workspace_id)
    if evidence_pack["counts"]["achievements"] == 0 and evidence_pack["counts"]["stories"] == 0:
        payload = _fallback_assessment(reason="no_evidence")
    else:
        try:
            payload = await _run_capability_model(evidence_pack)
        except Exception:
            logger.exception("Performance coach sync refresh failed because model execution failed")
            payload = _fallback_assessment(reason="model_error")

    # Override status to completed since we ran it synchronously
    payload = payload.model_copy(update={"status": "completed"})
    return await save_assessment_snapshot(session, profile.id, payload)


async def get_latest_assessment(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> CapabilityAssessmentResponse | None:
    profile = await _get_profile_row(session, user_id, workspace_id)
    if profile is None:
        return None

    row = await _get_latest_snapshot_row(session, profile.id)
    if row is None:
        return None

    # Auto-heal stale pending snapshots (e.g., background task lost or weekly review orphan)
    if row.status == "pending" and row.created_at:
        stale_threshold = _utcnow() - timedelta(minutes=PENDING_TIMEOUT_MINUTES)
        if row.created_at < stale_threshold:
            row.status = "failed"
            row.core_reasoning_markdown = "评估超时中断，请重新触发刷新。"
            row.updated_at = _utcnow()
            await session.commit()
            await session.refresh(row)

    return _to_response(row)


async def list_assessments(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> list[CapabilityAssessmentResponse]:
    profile = await _get_profile_row(session, user_id, workspace_id)
    if profile is None:
        return []

    stmt = (
        select(CapabilityAssessmentSnapshot)
        .where(
            CapabilityAssessmentSnapshot.profile_id == profile.id,
            CapabilityAssessmentSnapshot.deleted_at.is_(None),
        )
        .order_by(
            CapabilityAssessmentSnapshot.created_at.desc(),
            CapabilityAssessmentSnapshot.id.desc(),
        )
    )
    result = await session.execute(stmt)
    return [_to_response(row) for row in result.scalars().all()]
