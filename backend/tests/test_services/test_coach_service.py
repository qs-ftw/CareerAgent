"""Tests for capability assessment snapshot persistence."""

from __future__ import annotations

from datetime import datetime, timezone
from datetime import date
import uuid

import pytest
from pydantic import ValidationError
from sqlalchemy import delete, select

from src.core.database import AsyncSessionLocal
from src.models.capability_assessment import CapabilityAssessmentSnapshot
from src.models.achievement import Achievement
from src.models.project import Project
from src.models.story import InterviewStory
from src.models.work_experience import WorkExperience
from src.models.coach_context import PerformanceContextItem
from src.schemas.coach import (
    CapabilityAssessmentPersist,
    CapabilityDimensionAssessment,
    CapabilityEvidenceLink,
)
from src.schemas.profile import CareerProfileUpsert
from src.services import coach_service
from src.services.profile_service import upsert_profile


USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def _make_payload(
    core_level: str,
    dimension_level: str,
    title: str,
) -> CapabilityAssessmentPersist:
    return CapabilityAssessmentPersist(
        assessment_scope="manual",
        core_level=core_level,
        core_reasoning_markdown=f"{core_level} reasoning",
        dimension_levels={
            "execution_delivery": CapabilityDimensionAssessment(
                level=dimension_level,
                status="proven",
                summary="连续完成明确任务并形成结果。",
                evidence_count=2,
            )
        },
        evidence_links=[
            CapabilityEvidenceLink(
                source_type="achievement",
                source_id=uuid.UUID("00000000-0000-0000-0000-000000000002"),
                title=title,
                summary="One proven achievement link.",
                dimensions=["execution_delivery"],
            )
        ],
        next_level_gaps=["缺少 owner 级模块负责证据"],
        suggested_actions=["补充一个独立负责模块的闭环案例"],
    )


@pytest.mark.asyncio
async def test_save_and_get_latest_assessment_snapshot_roundtrips():
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Snapshot test profile"),
        )
        await session.commit()

        payload = _make_payload(
            core_level="C1",
            dimension_level="L2",
            title="Snapshot evidence",
        )

        await coach_service.save_assessment_snapshot(session, profile.id, payload)
        await session.commit()

        result = await coach_service.get_latest_assessment(session, USER_ID, WORKSPACE_ID)

        assert result is not None
        assert result.core_level == "C1"
        assert result.dimension_levels["execution_delivery"].level == "L2"
        assert result.next_level_gaps == ["缺少 owner 级模块负责证据"]


@pytest.mark.asyncio
async def test_save_snapshot_assigns_distinct_timestamps_within_same_transaction():
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Distinct timestamp test profile"),
        )
        await session.commit()

        first = await coach_service.save_assessment_snapshot(
            session,
            profile.id,
            _make_payload(core_level="C1", dimension_level="L1", title="First snapshot"),
        )
        second = await coach_service.save_assessment_snapshot(
            session,
            profile.id,
            _make_payload(core_level="C2", dimension_level="L2", title="Second snapshot"),
        )
        await session.commit()

        latest = await coach_service.get_latest_assessment(session, USER_ID, WORKSPACE_ID)

        assert first.created_at != second.created_at
        assert latest is not None
        assert latest.core_level == "C2"


@pytest.mark.asyncio
async def test_get_latest_assessment_skips_soft_deleted_newest_snapshot():
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Soft delete fallback test profile"),
        )
        await session.commit()

        first = await coach_service.save_assessment_snapshot(
            session,
            profile.id,
            _make_payload(core_level="C1", dimension_level="L1", title="Older snapshot"),
        )
        second = await coach_service.save_assessment_snapshot(
            session,
            profile.id,
            _make_payload(core_level="C2", dimension_level="L2", title="Newest snapshot"),
        )
        newest_row = await session.get(CapabilityAssessmentSnapshot, second.id)
        assert newest_row is not None
        newest_row.deleted_at = datetime.now(timezone.utc)
        await session.commit()

        latest = await coach_service.get_latest_assessment(session, USER_ID, WORKSPACE_ID)

        assert latest is not None
        assert latest.id == first.id
        assert latest.core_level == "C1"


@pytest.mark.asyncio
async def test_refresh_assessment_aggregates_existing_evidence_and_persists_snapshot(
    monkeypatch: pytest.MonkeyPatch,
):
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(
                name="Jane Coach",
                headline="Refresh test profile",
                professional_summary="Builds reliable backend systems and coaches delivery quality.",
                skill_categories={
                    "backend": ["python", "postgres"],
                    "leadership": ["mentoring"],
                },
            ),
        )
        await session.execute(delete(InterviewStory).where(
            InterviewStory.user_id == USER_ID,
            InterviewStory.workspace_id == WORKSPACE_ID,
        ))
        await session.execute(delete(Achievement).where(Achievement.profile_id == profile.id))
        await session.execute(delete(Project).where(Project.profile_id == profile.id))
        await session.execute(delete(WorkExperience).where(WorkExperience.profile_id == profile.id))
        await session.flush()
        work_experience = WorkExperience(
            profile_id=profile.id,
            company_name="Acme",
            company_url="",
            location="Remote",
            role_title="Senior Engineer",
            start_date=date(2022, 1, 1),
            end_date=None,
            description="Built and shipped systems.",
            sort_order=0,
        )
        project = Project(
            profile_id=profile.id,
            work_experience_id=None,
            education_id=None,
            name="Reliability Platform",
            description="Owns service reliability improvements.",
            tech_stack=["python", "postgres"],
            url="",
            start_date=date(2023, 1, 1),
            end_date=None,
            sort_order=0,
        )
        session.add_all([work_experience, project])
        await session.flush()
        achievement = Achievement(
            profile_id=profile.id,
            project_id=project.id,
            work_experience_id=work_experience.id,
            education_id=None,
            title="Repaired training pipeline failures",
            raw_content="Resolved the pipeline breakage and stabilized delivery.",
            parsed_data=None,
            tags=["delivery"],
            importance_score=0.9,
            source_type="manual",
            status="raw",
            date_occurred=date(2024, 5, 1),
            analysis_chat=None,
            enrichment_suggestions=None,
            polished_content=None,
            display_format="raw",
        )
        session.add(achievement)
        await session.flush()
        interview_story = InterviewStory(
            workspace_id=WORKSPACE_ID,
            user_id=USER_ID,
            question_text="Pipeline recovery story",
            theme="execution_delivery",
            answer_markdown="""situation: 训练链路出现回归故障。
task: 稳定交付并恢复训练流程。
action: 定位问题，修复链路，补充校验。
result: 流程恢复稳定并可复用。""",
            linked_achievement_ids=[str(achievement.id)],
            confidence_score=0.92,
        )
        session.add(interview_story)
        await session.flush()

        context_item = PerformanceContextItem(
            profile_id=profile.id,
            title="Training Pipeline Reliability",
            summary="Improve training pipeline stability.",
            linked_work_experience_id=work_experience.id,
            linked_project_ids=[str(project.id)],
            linked_achievement_ids=[str(achievement.id)],
        )
        session.add(context_item)
        await session.flush()

        async def fake_run_capability_model(evidence_pack: dict) -> CapabilityAssessmentPersist:
            assert evidence_pack["profile"]["id"] == str(profile.id)
            assert evidence_pack["profile"]["name"] == "Jane Coach"
            assert evidence_pack["profile"]["headline"] == "Refresh test profile"
            assert (
                evidence_pack["profile"]["professional_summary"]
                == "Builds reliable backend systems and coaches delivery quality."
            )
            assert evidence_pack["profile"]["skill_categories"] == {
                "backend": ["python", "postgres"],
                "leadership": ["mentoring"],
            }
            assert evidence_pack["counts"]["work_experiences"] == 1
            assert evidence_pack["counts"]["projects"] == 1
            assert evidence_pack["counts"]["achievements"] == 1
            assert evidence_pack["counts"]["stories"] == 1
            assert evidence_pack["achievements"][0]["title"] == "Repaired training pipeline failures"
            assert evidence_pack["stories"][0]["linked_achievement_ids"] == [str(achievement.id)]
            return CapabilityAssessmentPersist(
                assessment_scope="full_refresh",
                core_level="C1",
                core_reasoning_markdown="现有证据证明已达到稳定交付的 C1。",
                dimension_levels={
                    "execution_delivery": CapabilityDimensionAssessment(
                        level="L2",
                        status="proven",
                        summary="已形成稳定交付证据。",
                        evidence_count=2,
                    ),
                    "breakthrough_problem_solving": CapabilityDimensionAssessment(
                        level="L1",
                        status="partial",
                        summary="有问题定位和修复证据，但尚未形成突破性闭环。",
                        evidence_count=1,
                    ),
                },
                evidence_links=[
                    CapabilityEvidenceLink(
                        source_type="achievement",
                        source_id=achievement.id,
                        title=achievement.title,
                        summary="训练链路修复经验。",
                        dimensions=["execution_delivery"],
                    )
                ],
                next_level_gaps=["缺少 owner 级模块闭环和复用性资产"],
                suggested_actions=["把训练链路修复经验沉淀成可复用运行手册"],
            )

        monkeypatch.setattr(coach_service, "_run_capability_model", fake_run_capability_model)

        result = await coach_service.refresh_assessment_sync(session, USER_ID, WORKSPACE_ID)
        await session.commit()

        assert result is not None
        assert result.assessment_scope == "full_refresh"
        assert result.core_level == "C1"
        assert result.evidence_links[0].title == achievement.title
        assert result.suggested_actions == ["把训练链路修复经验沉淀成可复用运行手册"]


@pytest.mark.asyncio
async def test_run_capability_model_forces_full_refresh_scope(monkeypatch: pytest.MonkeyPatch):
    class FakeLLM:
        async def ainvoke(self, prompt: str):
            assert "<evidence_pack>" in prompt
            return type(
                "Response",
                (),
                {
                    "content": """{
                        "core_level": "C1",
                        "core_reasoning_markdown": "有明确证据支持 C1。",
                        "dimension_levels": {},
                        "evidence_links": [],
                        "next_level_gaps": ["缺少 owner 级闭环证据"],
                        "suggested_actions": ["补充一条完整交付闭环案例"]
                    }"""
                },
            )()

    monkeypatch.setattr(coach_service, "get_llm", lambda agent_name: FakeLLM())

    result = await coach_service._run_capability_model(
        {
            "profile_id": str(USER_ID),
            "counts": {"work_experiences": 0, "projects": 0, "achievements": 1, "stories": 0},
            "work_experiences": [],
            "projects": [],
            "achievements": [{"id": "a"}],
            "stories": [],
        }
    )

    assert result.assessment_scope == "full_refresh"
    assert result.core_level == "C1"


@pytest.mark.asyncio
async def test_run_capability_model_rejects_invalid_dimension_keys(monkeypatch: pytest.MonkeyPatch):
    class FakeLLM:
        async def ainvoke(self, prompt: str):
            return type(
                "Response",
                (),
                {
                    "content": """{
                        "core_level": "C1",
                        "core_reasoning_markdown": "invalid dimension test",
                        "dimension_levels": {
                            "made_up_dimension": {
                                "level": "L1",
                                "status": "partial",
                                "summary": "bad key",
                                "evidence_count": 1
                            }
                        },
                        "evidence_links": [],
                        "next_level_gaps": [],
                        "suggested_actions": []
                    }"""
                },
            )()

    monkeypatch.setattr(coach_service, "get_llm", lambda agent_name: FakeLLM())

    with pytest.raises(ValidationError):
        await coach_service._run_capability_model(
            {
                "profile_id": str(USER_ID),
                "counts": {"work_experiences": 0, "projects": 0, "achievements": 1, "stories": 0},
                "work_experiences": [],
                "projects": [],
                "achievements": [{"id": "a"}],
                "stories": [],
            }
        )


@pytest.mark.asyncio
async def test_refresh_assessment_returns_latest_snapshot_when_model_errors(
    monkeypatch: pytest.MonkeyPatch,
):
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Refresh failure fallback profile"),
        )
        await session.execute(delete(Achievement).where(Achievement.profile_id == profile.id))
        await session.flush()
        before_snapshot_count = len(
            (
                await session.execute(
                    select(CapabilityAssessmentSnapshot).where(
                        CapabilityAssessmentSnapshot.profile_id == profile.id,
                        CapabilityAssessmentSnapshot.deleted_at.is_(None),
                    )
                )
            ).scalars().all()
        )

        achievement = Achievement(
            profile_id=profile.id,
            project_id=None,
            work_experience_id=None,
            education_id=None,
            title="Fallback trigger achievement",
            raw_content="Exists to bypass no-evidence fallback.",
            parsed_data=None,
            tags=["delivery"],
            importance_score=0.5,
            source_type="manual",
            status="raw",
            date_occurred=None,
            analysis_chat=None,
            enrichment_suggestions=None,
            polished_content=None,
            display_format="raw",
        )
        session.add(achievement)
        latest_snapshot = await coach_service.save_assessment_snapshot(
            session,
            profile.id,
            _make_payload(core_level="C2", dimension_level="L3", title="Existing snapshot"),
        )
        await session.commit()

        async def fake_run_capability_model(_evidence_pack: dict):
            raise RuntimeError("llm parse failed")

        monkeypatch.setattr(coach_service, "_run_capability_model", fake_run_capability_model)

        result = await coach_service.refresh_assessment_sync(session, USER_ID, WORKSPACE_ID)
        await session.commit()
        snapshot_rows = (
            await session.execute(
                select(CapabilityAssessmentSnapshot).where(
                    CapabilityAssessmentSnapshot.profile_id == profile.id,
                    CapabilityAssessmentSnapshot.deleted_at.is_(None),
                )
            )
        ).scalars().all()
        latest = await coach_service.get_latest_assessment(session, USER_ID, WORKSPACE_ID)

        assert result is not None
        assert result.id != latest_snapshot.id
        assert result.core_level == "未证明"
        assert "重新触发刷新" in result.core_reasoning_markdown
        assert len(snapshot_rows) == before_snapshot_count + 2
        assert latest is not None
        assert latest.id == result.id


@pytest.mark.asyncio
async def test_run_capability_model_rejects_hallucinated_evidence_links(
    monkeypatch: pytest.MonkeyPatch,
):
    class FakeLLM:
        async def ainvoke(self, prompt: str):
            return type(
                "Response",
                (),
                {
                    "content": """{
                        "core_level": "C1",
                        "core_reasoning_markdown": "invalid evidence link test",
                        "dimension_levels": {},
                        "evidence_links": [
                            {
                                "source_type": "achievement",
                                "source_id": "00000000-0000-0000-0000-000000000099",
                                "title": "Hallucinated evidence",
                                "summary": "not present in evidence pack",
                                "dimensions": ["execution_delivery"]
                            }
                        ],
                        "next_level_gaps": [],
                        "suggested_actions": []
                    }"""
                },
            )()

    monkeypatch.setattr(coach_service, "get_llm", lambda agent_name: FakeLLM())

    with pytest.raises(ValueError, match="evidence_links"):
        await coach_service._run_capability_model(
            {
                "profile_id": str(USER_ID),
                "profile": {
                    "id": str(USER_ID),
                    "name": "Jane Coach",
                    "headline": "Backend Engineer",
                    "professional_summary": "",
                    "skill_categories": {},
                },
                "counts": {"work_experiences": 0, "projects": 0, "achievements": 1, "stories": 0},
                "work_experiences": [],
                "projects": [],
                "achievements": [{"id": "00000000-0000-0000-0000-000000000002"}],
                "stories": [],
            }
        )


@pytest.mark.asyncio
async def test_get_latest_assessment_sanitizes_unknown_persisted_dimensions():
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Legacy dimension snapshot profile"),
        )
        legacy_evidence_id = uuid.UUID("00000000-0000-0000-0000-000000000003")
        row = CapabilityAssessmentSnapshot(
            profile_id=profile.id,
            assessment_scope="full_refresh",
            core_level="C1",
            core_reasoning_markdown="Legacy snapshot payload",
            dimension_levels_json={
                "execution_delivery": {
                    "level": "L2",
                    "status": "proven",
                    "summary": "Known dimension should remain.",
                    "evidence_count": 1,
                },
                "legacy_dimension": {
                    "level": "L9",
                    "status": "partial",
                    "summary": "Unknown dimension should be dropped.",
                    "evidence_count": 1,
                },
            },
            evidence_links_json=[
                {
                    "source_type": "achievement",
                    "source_id": str(legacy_evidence_id),
                    "title": "Legacy evidence",
                    "summary": "Contains one supported and one unsupported dimension.",
                    "dimensions": ["execution_delivery", "legacy_dimension"],
                }
            ],
            next_level_gap_json=[],
            suggested_actions_json=[],
        )
        session.add(row)
        await session.commit()

        result = await coach_service.get_latest_assessment(session, USER_ID, WORKSPACE_ID)

        assert result is not None
        assert set(result.dimension_levels) == {"execution_delivery"}
        assert result.evidence_links[0].dimensions == ["execution_delivery"]


@pytest.mark.asyncio
async def test_run_capability_model_extracts_json_from_fenced_response(
    monkeypatch: pytest.MonkeyPatch,
):
    class FakeLLM:
        async def ainvoke(self, prompt: str):
            assert "<evidence_pack>" in prompt
            return type(
                "Response",
                (),
                {
                    "content": """Here is the assessment result:

```json
{
  "core_level": "C1",
  "core_reasoning_markdown": "有明确证据支持 C1。",
  "dimension_levels": {},
  "evidence_links": [
    {
      "source_type": "achievement",
      "source_id": "00000000-0000-0000-0000-000000000002",
      "title": "Evidence link",
      "summary": "From fenced JSON",
      "dimensions": ["execution_delivery"]
    }
  ],
  "next_level_gaps": ["缺少 owner 级闭环证据"],
  "suggested_actions": ["补充一条完整交付闭环案例"]
}
```

Use this conservatively.
"""
                },
            )()

    monkeypatch.setattr(coach_service, "get_llm", lambda agent_name: FakeLLM())

    result = await coach_service._run_capability_model(
        {
            "profile_id": str(USER_ID),
            "profile": {
                "id": str(USER_ID),
                "name": "Jane Coach",
                "headline": "Backend Engineer",
                "professional_summary": "",
                "skill_categories": {},
            },
            "counts": {"work_experiences": 0, "projects": 0, "achievements": 1, "stories": 0},
            "work_experiences": [],
            "projects": [],
            "achievements": [{"id": "00000000-0000-0000-0000-000000000002"}],
            "stories": [],
        }
    )

    assert result.assessment_scope == "full_refresh"
    assert result.core_level == "C1"
    assert result.evidence_links[0].source_id == uuid.UUID("00000000-0000-0000-0000-000000000002")


@pytest.mark.asyncio
async def test_refresh_assessment_uses_no_evidence_fallback_for_context_only_assets(
    monkeypatch: pytest.MonkeyPatch,
):
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Context-only assets profile"),
        )
        await session.execute(delete(InterviewStory).where(
            InterviewStory.user_id == USER_ID,
            InterviewStory.workspace_id == WORKSPACE_ID,
        ))
        await session.execute(delete(Achievement).where(Achievement.profile_id == profile.id))
        await session.execute(delete(Project).where(Project.profile_id == profile.id))
        await session.execute(delete(WorkExperience).where(WorkExperience.profile_id == profile.id))
        await session.flush()

        work_experience = WorkExperience(
            profile_id=profile.id,
            company_name="Acme",
            company_url="",
            location="Remote",
            role_title="Platform Engineer",
            start_date=date(2021, 1, 1),
            end_date=None,
            description="Operated platform services.",
            sort_order=0,
        )
        project = Project(
            profile_id=profile.id,
            work_experience_id=None,
            education_id=None,
            name="Cost Optimization",
            description="Improved efficiency for internal systems.",
            tech_stack=["python"],
            url="",
            start_date=date(2023, 1, 1),
            end_date=None,
            sort_order=0,
        )
        session.add_all([work_experience, project])
        await session.commit()

        called = False

        async def fake_run_capability_model(_evidence_pack: dict):
            nonlocal called
            called = True
            raise AssertionError("LLM path should not run for context-only assets")

        monkeypatch.setattr(coach_service, "_run_capability_model", fake_run_capability_model)

        result = await coach_service.refresh_assessment_sync(session, USER_ID, WORKSPACE_ID)
        await session.commit()

        assert called is False
        assert result is not None
        assert result.assessment_scope == "full_refresh"
        assert result.core_level == "未证明"
        assert "证据不足" in result.core_reasoning_markdown
