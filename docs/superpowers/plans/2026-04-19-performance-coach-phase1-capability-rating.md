# Performance Coach Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 1 of the approved Performance Coach spec: a new `/coach` workspace that rates the user's current proven capability level from existing evidence and renders the capability overview UI.

**Architecture:** Add a persisted `CapabilityAssessmentSnapshot` backend model plus a `coach_service` that gathers existing profile/project/achievement/story evidence and saves assessment snapshots. Expose `GET /coach/assessment/latest`, `GET /coach/assessments`, and `POST /coach/assessment/refresh`, then add a frontend `/coach` route with a capability overview page composed from focused UI components.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, existing LLM factory, React, React Router, TanStack Query, Tailwind CSS, Vitest, pytest, Ruff, ESLint

---

## Scope Guard

This plan intentionally covers **only Phase 1** from [2026-04-19-performance-coach-design.md](/Users/gaoqiangsheng/work/playground/CareerAgent/docs/superpowers/specs/2026-04-19-performance-coach-design.md):

- new `/coach` route and sidebar entry
- capability assessment snapshots
- evidence aggregation from existing assets
- latest assessment API
- overview UI with Core level, five-dimension view, evidence, gaps, and advice rail

Do **not** implement Phase 2 (`工作上下文`), Phase 3 (`个人 OKR`), or Phase 4 (`周报复盘`) in this plan. Those require separate follow-on plans once Phase 1 is merged and verified.

---

## File Structure

### Backend

- Create: `backend/src/models/capability_assessment.py`
  - Persist capability assessment snapshots for the canonical `CareerProfile`
- Modify: `backend/src/models/__init__.py`
  - Register the new model for table creation and Alembic visibility
- Create: `backend/src/schemas/coach.py`
  - API response models and nested capability assessment contracts
- Create: `backend/src/services/coach_service.py`
  - Fetch canonical profile, gather evidence, run assessment, save snapshots, serve latest/history
- Create: `backend/src/prompts/capability_assessment.py`
  - Structured rubric and prompt builder for strict evidence-backed capability grading
- Modify: `backend/src/core/llm.py`
  - Add a dedicated `performance_coach_assessment` agent key
- Create: `backend/src/api/coach.py`
  - Coach assessment endpoints
- Modify: `backend/src/api/router.py`
  - Include the new router
- Create: `backend/alembic/versions/20260419_02_add_capability_assessment_snapshots.py`
  - Add the snapshots table
- Create: `backend/tests/test_services/test_coach_service.py`
  - Service-level persistence + refresh tests
- Create: `backend/tests/test_api/test_coach_api.py`
  - Endpoint contract tests

### Frontend

- Modify: `frontend/src/types/index.ts`
  - Add coach-specific assessment types
- Modify: `frontend/src/lib/api.ts`
  - Add `coachApi`
- Create: `frontend/src/hooks/useCoach.ts`
  - Query and mutation hooks for latest/history/refresh
- Modify: `frontend/src/App.tsx`
  - Add `/coach`
- Modify: `frontend/src/components/layout/Sidebar.tsx`
  - Add `绩效教练`
- Create: `frontend/src/pages/PerformanceCoach.tsx`
  - Page shell, tabs, loading/error/empty states, refresh action
- Create: `frontend/src/components/coach/CoachOverview.tsx`
  - Compose the overview body
- Create: `frontend/src/components/coach/CoreLevelCard.tsx`
  - Render primary Core level card
- Create: `frontend/src/components/coach/CapabilityRadar.tsx`
  - Render a simple SVG radar without adding a chart library
- Create: `frontend/src/components/coach/EvidenceReasonList.tsx`
  - Show evidence-backed reasons
- Create: `frontend/src/components/coach/NextGapChecklist.tsx`
  - Show next-level gaps
- Create: `frontend/src/components/coach/CoachAdviceRail.tsx`
  - Right-side suggested actions rail
- Create: `frontend/src/pages/__tests__/PerformanceCoach.test.tsx`
  - Route shell + overview rendering tests

---

## Data Contract Decisions

- `core_level` stays a string so Phase 1 can return `C1`-`C4` or `未证明`
- five-dimension keys are normalized English identifiers:
  - `exploration_innovation`
  - `breakthrough_problem_solving`
  - `execution_delivery`
  - `core_backbone`
  - `collaboration_influence`
- `evidence_links_json` stores flat linked artifacts with:
  - `source_type`
  - `source_id`
  - `title`
  - `summary`
  - `dimensions`
- `next_level_gap_json` is an ordered string list for direct UI rendering
- `suggested_actions_json` is an ordered string list for the right rail

---

## Task 1: Persist Capability Assessment Snapshots

**Files:**
- Create: `backend/src/models/capability_assessment.py`
- Modify: `backend/src/models/__init__.py`
- Create: `backend/src/schemas/coach.py`
- Create: `backend/src/services/coach_service.py`
- Create: `backend/alembic/versions/20260419_02_add_capability_assessment_snapshots.py`
- Test: `backend/tests/test_services/test_coach_service.py`

- [ ] **Step 1: Write the failing snapshot persistence test**

```python
"""Tests for coach service snapshot persistence."""

from __future__ import annotations

import uuid
from datetime import date

import pytest

from src.core.database import AsyncSessionLocal
from src.schemas.coach import (
    CapabilityAssessmentPersist,
    CapabilityDimensionAssessment,
    CapabilityEvidenceLink,
)
from src.schemas.profile import CareerProfileUpsert
from src.services import coach_service, profile_service

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest.mark.asyncio
async def test_save_and_fetch_latest_assessment_snapshot():
    async with AsyncSessionLocal() as session:
        profile = await profile_service.upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(name="Qiuwu", headline="Infra engineer"),
        )
        await session.commit()

        payload = CapabilityAssessmentPersist(
            assessment_scope="manual",
            core_level="C1",
            core_reasoning_markdown="稳定交付证据已满足 C1。",
            dimension_levels={
                "execution_delivery": CapabilityDimensionAssessment(
                    level="L2",
                    status="proven",
                    summary="连续完成明确任务并形成结果。",
                    evidence_count=2,
                )
            },
            evidence_links=[
                CapabilityEvidenceLink(
                    source_type="achievement",
                    source_id=uuid.uuid4(),
                    title="训练链路稳定性修复",
                    summary="减少了回归问题并完成上线。",
                    dimensions=["execution_delivery"],
                )
            ],
            next_level_gaps=["缺少 owner 级模块负责证据"],
            suggested_actions=["补充一个独立负责模块的闭环案例"],
        )

        created = await coach_service.save_assessment_snapshot(session, profile.id, payload)
        await session.commit()

        latest = await coach_service.get_latest_assessment(session, USER_ID, WORKSPACE_ID)

        assert created.core_level == "C1"
        assert latest is not None
        assert latest.core_level == "C1"
        assert latest.dimension_levels["execution_delivery"].level == "L2"
        assert latest.next_level_gaps == ["缺少 owner 级模块负责证据"]
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd backend && python -m pytest tests/test_services/test_coach_service.py::test_save_and_fetch_latest_assessment_snapshot -v
```

Expected:

```text
E   ModuleNotFoundError: No module named 'src.schemas.coach'
```

- [ ] **Step 3: Create the snapshot model and register it**

Create `backend/src/models/capability_assessment.py`:

```python
"""Capability assessment snapshot model."""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import CommonBase


class CapabilityAssessmentSnapshot(CommonBase):
    __tablename__ = "capability_assessment_snapshots"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessment_scope: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    core_level: Mapped[str] = mapped_column(String(32), nullable=False, default="未证明")
    core_reasoning_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    dimension_levels_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    evidence_links_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    next_level_gap_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    suggested_actions_json: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
```

Update `backend/src/models/__init__.py`:

```python
from src.models.capability_assessment import CapabilityAssessmentSnapshot
```

And add it to `__all__`:

```python
    "CapabilityAssessmentSnapshot",
```

- [ ] **Step 4: Create the coach schemas and minimal CRUD service**

Create `backend/src/schemas/coach.py`:

```python
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class CapabilityDimensionAssessment(BaseModel):
    level: str = "未证明"
    status: Literal["proven", "partial", "unproven"] = "unproven"
    summary: str = ""
    evidence_count: int = 0


class CapabilityEvidenceLink(BaseModel):
    source_type: str
    source_id: UUID
    title: str
    summary: str = ""
    dimensions: list[str] = Field(default_factory=list)


class CapabilityAssessmentPersist(BaseModel):
    assessment_scope: str = "manual"
    core_level: str = "未证明"
    core_reasoning_markdown: str = ""
    dimension_levels: dict[str, CapabilityDimensionAssessment] = Field(default_factory=dict)
    evidence_links: list[CapabilityEvidenceLink] = Field(default_factory=list)
    next_level_gaps: list[str] = Field(default_factory=list)
    suggested_actions: list[str] = Field(default_factory=list)


class CapabilityAssessmentResponse(CapabilityAssessmentPersist):
    id: UUID
    profile_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

Create `backend/src/services/coach_service.py`:

```python
"""Database-backed service for performance coach capability assessments."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.capability_assessment import CapabilityAssessmentSnapshot
from src.models.profile import CareerProfile
from src.schemas.coach import CapabilityAssessmentPersist, CapabilityAssessmentResponse


def _to_response(row: CapabilityAssessmentSnapshot) -> CapabilityAssessmentResponse:
    return CapabilityAssessmentResponse(
        id=row.id,
        profile_id=row.profile_id,
        assessment_scope=row.assessment_scope,
        core_level=row.core_level,
        core_reasoning_markdown=row.core_reasoning_markdown,
        dimension_levels=row.dimension_levels_json or {},
        evidence_links=row.evidence_links_json or [],
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
    stmt = select(CareerProfile).where(
        CareerProfile.user_id == user_id,
        CareerProfile.workspace_id == workspace_id,
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def save_assessment_snapshot(
    session: AsyncSession,
    profile_id: uuid.UUID,
    payload: CapabilityAssessmentPersist,
) -> CapabilityAssessmentResponse:
    row = CapabilityAssessmentSnapshot(
        profile_id=profile_id,
        assessment_scope=payload.assessment_scope,
        core_level=payload.core_level,
        core_reasoning_markdown=payload.core_reasoning_markdown,
        dimension_levels_json=payload.dimension_levels,
        evidence_links_json=payload.evidence_links,
        next_level_gap_json=payload.next_level_gaps,
        suggested_actions_json=payload.suggested_actions,
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return _to_response(row)


async def get_latest_assessment(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> CapabilityAssessmentResponse | None:
    profile = await _get_profile_row(session, user_id, workspace_id)
    if profile is None:
        return None

    stmt = (
        select(CapabilityAssessmentSnapshot)
        .where(
            CapabilityAssessmentSnapshot.profile_id == profile.id,
            CapabilityAssessmentSnapshot.deleted_at.is_(None),
        )
        .order_by(CapabilityAssessmentSnapshot.created_at.desc())
    )
    result = await session.execute(stmt)
    row = result.scalars().first()
    return _to_response(row) if row else None
```

- [ ] **Step 5: Add the Alembic migration**

Create `backend/alembic/versions/20260419_02_add_capability_assessment_snapshots.py`:

```python
"""add capability assessment snapshots

Revision ID: b6a14fd9f6a1
Revises: a829a16283ff
Create Date: 2026-04-19 20:05:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "b6a14fd9f6a1"
down_revision: Union[str, None] = "a829a16283ff"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "capability_assessment_snapshots",
        sa.Column("profile_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_scope", sa.String(length=32), nullable=False),
        sa.Column("core_level", sa.String(length=32), nullable=False),
        sa.Column("core_reasoning_markdown", sa.Text(), nullable=False),
        sa.Column("dimension_levels_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("evidence_links_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("next_level_gap_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("suggested_actions_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["profile_id"], ["career_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_capability_assessment_snapshots_profile_id",
        "capability_assessment_snapshots",
        ["profile_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_capability_assessment_snapshots_profile_id", table_name="capability_assessment_snapshots")
    op.drop_table("capability_assessment_snapshots")
```

- [ ] **Step 6: Run the service test to verify it passes**

Run:

```bash
cd backend && python -m pytest tests/test_services/test_coach_service.py::test_save_and_fetch_latest_assessment_snapshot -v
```

Expected:

```text
tests/test_services/test_coach_service.py::test_save_and_fetch_latest_assessment_snapshot PASSED
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/models/capability_assessment.py backend/src/models/__init__.py backend/src/schemas/coach.py backend/src/services/coach_service.py backend/alembic/versions/20260419_02_add_capability_assessment_snapshots.py backend/tests/test_services/test_coach_service.py
git commit -m "feat(coach): persist capability assessment snapshots"
```

### Task 2: Add Evidence Aggregation and Refresh Logic

**Files:**
- Modify: `backend/src/services/coach_service.py`
- Create: `backend/src/prompts/capability_assessment.py`
- Modify: `backend/src/core/llm.py`
- Test: `backend/tests/test_services/test_coach_service.py`

- [ ] **Step 1: Extend the service test with a failing refresh test**

Append this test to `backend/tests/test_services/test_coach_service.py`:

```python
from src.models.achievement import Achievement
from src.models.project import Project
from src.models.story import InterviewStory
from src.models.work_experience import WorkExperience


@pytest.mark.asyncio
async def test_refresh_assessment_collects_existing_assets_and_saves_snapshot(monkeypatch):
    async with AsyncSessionLocal() as session:
        profile = await profile_service.upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(name="Qiuwu", headline="Platform engineer"),
        )
        await session.flush()

        work = WorkExperience(
            profile_id=profile.id,
            company_name="ByteDance",
            role_title="Infra Engineer",
            start_date=date(2024, 1, 1),
        )
        session.add(work)
        await session.flush()

        project = Project(
            profile_id=profile.id,
            work_experience_id=work.id,
            name="训练稳定性优化",
            description="负责训练链路稳定性和效率提升。",
        )
        session.add(project)
        await session.flush()

        achievement = Achievement(
            profile_id=profile.id,
            project_id=project.id,
            work_experience_id=work.id,
            title="修复训练链路回归问题",
            raw_content="定位数据污染导致的 loss 波动并修复。",
            status="analyzed",
            parsed_data={"metrics": ["训练成功率提升到 99%"]},
            tags=["stability", "delivery"],
        )
        session.add(achievement)
        await session.flush()

        story = InterviewStory(
            workspace_id=WORKSPACE_ID,
            user_id=USER_ID,
            question_text="描述一次你主导问题定位的经历",
            answer_markdown="我主导定位训练链路异常并完成修复。",
            theme="problem_solving",
            status="ready",
            linked_achievement_ids=[str(achievement.id)],
        )
        session.add(story)
        await session.commit()

        async def fake_runner(evidence_pack):
            assert evidence_pack["counts"]["achievements"] == 1
            assert evidence_pack["counts"]["projects"] == 1
            assert evidence_pack["counts"]["stories"] == 1
            return CapabilityAssessmentPersist(
                assessment_scope="full_refresh",
                core_level="C1",
                core_reasoning_markdown="现有证据证明已达到稳定交付的 C1。",
                dimension_levels={
                    "execution_delivery": CapabilityDimensionAssessment(
                        level="L2",
                        status="proven",
                        summary="已有明确结果闭环。",
                        evidence_count=2,
                    ),
                    "breakthrough_problem_solving": CapabilityDimensionAssessment(
                        level="L1",
                        status="partial",
                        summary="有问题定位证据，但架构级攻坚不足。",
                        evidence_count=1,
                    ),
                },
                evidence_links=[
                    CapabilityEvidenceLink(
                        source_type="achievement",
                        source_id=achievement.id,
                        title=achievement.title,
                        summary="训练成功率提升到 99%",
                        dimensions=["execution_delivery", "breakthrough_problem_solving"],
                    )
                ],
                next_level_gaps=["缺少 owner 级模块闭环和复用性资产"],
                suggested_actions=["把训练链路修复经验沉淀成可复用运行手册"],
            )

        monkeypatch.setattr(coach_service, "_run_capability_model", fake_runner)

        snapshot = await coach_service.refresh_assessment(session, USER_ID, WORKSPACE_ID)
        await session.commit()

        assert snapshot is not None
        assert snapshot.assessment_scope == "full_refresh"
        assert snapshot.core_level == "C1"
        assert snapshot.evidence_links[0].title == "修复训练链路回归问题"
        assert snapshot.suggested_actions == ["把训练链路修复经验沉淀成可复用运行手册"]
```

- [ ] **Step 2: Run the refresh test to verify it fails**

Run:

```bash
cd backend && python -m pytest tests/test_services/test_coach_service.py::test_refresh_assessment_collects_existing_assets_and_saves_snapshot -v
```

Expected:

```text
E   AttributeError: module 'src.services.coach_service' has no attribute 'refresh_assessment'
```

- [ ] **Step 3: Add the structured prompt and LLM key**

Create `backend/src/prompts/capability_assessment.py`:

```python
"""Structured prompt for strict evidence-backed capability assessment."""

from __future__ import annotations

import json
from typing import Any

CAPABILITY_RUBRIC = {
    "core_levels": {
        "C1": "独立闭环负责明确模块，交付质量稳定。",
        "C2": "主导子系统/关键链路，解决复杂问题，沉淀工程资产。",
        "C3": "跨团队技术接口人，定义标准，攻坚行业难题，技术布道。",
        "C4": "架构演进主导者，技术行业前沿广受认可，风险兜底。",
    },
    "dimensions": {
        "exploration_innovation": "探索创新",
        "breakthrough_problem_solving": "攻坚突破",
        "execution_delivery": "高执行力",
        "core_backbone": "核心骨干",
        "collaboration_influence": "协调赋能",
    },
    "hard_rules": [
        "只允许使用输入中的已绑定证据。",
        "证据不足时必须输出未证明或 partial，不允许猜测。",
        "Core 等级必须基于 Core 四层矩阵判断，不能按五维平均分推导。",
        "每个结论必须引用至少一条 evidence_links 中的证据。",
    ],
}

SYSTEM_PROMPT = """\
你是一个严格的绩效教练评估器。你的任务不是鼓励用户，而是基于证据判断其已经被证明达到的能力层级。

输出必须是严格 JSON，对应以下键：
- core_level
- core_reasoning_markdown
- dimension_levels
- evidence_links
- next_level_gaps
- suggested_actions
"""


def render_capability_assessment_prompt(evidence_pack: dict[str, Any]) -> str:
    return "\n".join(
        [
            SYSTEM_PROMPT,
            "<rubric>",
            json.dumps(CAPABILITY_RUBRIC, ensure_ascii=False, indent=2),
            "</rubric>",
            "<evidence_pack>",
            json.dumps(evidence_pack, ensure_ascii=False, indent=2),
            "</evidence_pack>",
        ]
    )
```

Update `backend/src/core/llm.py`:

```python
        "performance_coach_assessment": "default-openai",
```

- [ ] **Step 4: Implement evidence aggregation, LLM invocation, and refresh**

Update `backend/src/services/coach_service.py` with these additions:

```python
import json

from src.core.llm import get_llm
from src.models.achievement import Achievement
from src.models.project import Project
from src.models.story import InterviewStory
from src.models.work_experience import WorkExperience
from src.prompts.capability_assessment import render_capability_assessment_prompt
```

Add these helpers and refresh flow:

```python
async def _build_existing_evidence_pack(
    session: AsyncSession,
    profile_id: uuid.UUID,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> dict:
    work_rows = (
        await session.execute(
            select(WorkExperience).where(WorkExperience.profile_id == profile_id)
        )
    ).scalars().all()
    project_rows = (
        await session.execute(select(Project).where(Project.profile_id == profile_id))
    ).scalars().all()
    achievement_rows = (
        await session.execute(select(Achievement).where(Achievement.profile_id == profile_id))
    ).scalars().all()
    story_rows = (
        await session.execute(
            select(InterviewStory).where(
                InterviewStory.user_id == user_id,
                InterviewStory.workspace_id == workspace_id,
                InterviewStory.deleted_at.is_(None),
            )
        )
    ).scalars().all()

    return {
        "profile_id": str(profile_id),
        "counts": {
            "work_experiences": len(work_rows),
            "projects": len(project_rows),
            "achievements": len(achievement_rows),
            "stories": len(story_rows),
        },
        "work_experiences": [
            {
                "id": str(row.id),
                "company_name": row.company_name,
                "role_title": row.role_title,
                "description": row.description,
            }
            for row in work_rows
        ],
        "projects": [
            {
                "id": str(row.id),
                "name": row.name,
                "description": row.description,
                "work_experience_id": str(row.work_experience_id) if row.work_experience_id else None,
            }
            for row in project_rows
        ],
        "achievements": [
            {
                "id": str(row.id),
                "title": row.title,
                "raw_content": row.raw_content,
                "tags": row.tags,
                "parsed_data": row.parsed_data or {},
                "project_id": str(row.project_id) if row.project_id else None,
            }
            for row in achievement_rows
        ],
        "stories": [
            {
                "id": str(row.id),
                "question_text": row.question_text,
                "answer_markdown": row.answer_markdown,
                "theme": row.theme,
                "linked_achievement_ids": row.linked_achievement_ids or [],
            }
            for row in story_rows
        ],
    }


async def _run_capability_model(evidence_pack: dict) -> CapabilityAssessmentPersist:
    llm = get_llm("performance_coach_assessment")
    prompt = render_capability_assessment_prompt(evidence_pack)
    response = await llm.ainvoke(prompt)
    payload = json.loads(response.content)
    return CapabilityAssessmentPersist.model_validate(payload)


def _fallback_assessment() -> CapabilityAssessmentPersist:
    return CapabilityAssessmentPersist(
        assessment_scope="full_refresh",
        core_level="未证明",
        core_reasoning_markdown="系统内缺少足够证据，当前无法证明达到任何 Core 等级。",
        dimension_levels={},
        evidence_links=[],
        next_level_gaps=["先补充至少一条已完成且有结果的当前岗位相关证据"],
        suggested_actions=["从现有项目中挑选一件已完成工作，整理为成果证据"],
    )


async def refresh_assessment(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> CapabilityAssessmentResponse | None:
    profile = await _get_profile_row(session, user_id, workspace_id)
    if profile is None:
        return None

    evidence_pack = await _build_existing_evidence_pack(session, profile.id, user_id, workspace_id)
    if evidence_pack["counts"]["achievements"] == 0 and evidence_pack["counts"]["stories"] == 0:
        return await save_assessment_snapshot(session, profile.id, _fallback_assessment())

    try:
        payload = await _run_capability_model(evidence_pack)
    except Exception:
        payload = _fallback_assessment()

    return await save_assessment_snapshot(session, profile.id, payload)
```

- [ ] **Step 5: Run the service tests to verify they pass**

Run:

```bash
cd backend && python -m pytest tests/test_services/test_coach_service.py -v
```

Expected:

```text
tests/test_services/test_coach_service.py::test_save_and_fetch_latest_assessment_snapshot PASSED
tests/test_services/test_coach_service.py::test_refresh_assessment_collects_existing_assets_and_saves_snapshot PASSED
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/coach_service.py backend/src/prompts/capability_assessment.py backend/src/core/llm.py backend/tests/test_services/test_coach_service.py
git commit -m "feat(coach): add evidence-backed assessment refresh"
```

### Task 3: Expose Coach Assessment APIs

**Files:**
- Create: `backend/src/api/coach.py`
- Modify: `backend/src/api/router.py`
- Test: `backend/tests/test_api/test_coach_api.py`

- [ ] **Step 1: Write failing API tests**

Create `backend/tests/test_api/test_coach_api.py`:

```python
from __future__ import annotations

import uuid
from datetime import datetime

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.schemas.coach import CapabilityAssessmentResponse


@pytest.mark.asyncio
async def test_get_latest_coach_assessment_returns_null_when_service_has_no_snapshot(monkeypatch):
    from src.services import coach_service

    async def fake_get_latest(*args, **kwargs):
        return None

    monkeypatch.setattr(coach_service, "get_latest_assessment", fake_get_latest)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/coach/assessment/latest")

    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.asyncio
async def test_refresh_coach_assessment_returns_snapshot(monkeypatch):
    from src.services import coach_service

    async def fake_refresh(*args, **kwargs):
        return CapabilityAssessmentResponse(
            id=uuid.uuid4(),
            profile_id=uuid.uuid4(),
            assessment_scope="full_refresh",
            core_level="C1",
            core_reasoning_markdown="现有证据证明达到 C1。",
            dimension_levels={},
            evidence_links=[],
            next_level_gaps=["缺少 owner 级模块证据"],
            suggested_actions=["补充一个模块 owner 闭环案例"],
            created_at=datetime.fromisoformat("2026-04-19T00:00:00+00:00"),
            updated_at=datetime.fromisoformat("2026-04-19T00:00:00+00:00"),
        )

    monkeypatch.setattr(coach_service, "refresh_assessment", fake_refresh)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/coach/assessment/refresh")

    assert response.status_code == 200
    assert response.json()["core_level"] == "C1"
```

- [ ] **Step 2: Run the API tests to verify they fail**

Run:

```bash
cd backend && python -m pytest tests/test_api/test_coach_api.py -v
```

Expected:

```text
E   httpx.HTTPStatusError or 404 because /api/coach/... routes do not exist yet
```

- [ ] **Step 3: Implement the coach router**

Create `backend/src/api/coach.py`:

```python
"""Coach assessment endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user_id, get_current_workspace_id
from src.schemas.coach import CapabilityAssessmentResponse
from src.services import coach_service

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
    db: AsyncSession = Depends(get_db),
) -> CapabilityAssessmentResponse | None:
    user_id = await get_current_user_id()
    workspace_id = await get_current_workspace_id()
    return await coach_service.refresh_assessment(db, user_id, workspace_id)
```

Update `backend/src/services/coach_service.py` with history listing:

```python
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
        .order_by(CapabilityAssessmentSnapshot.created_at.desc())
    )
    result = await session.execute(stmt)
    return [_to_response(row) for row in result.scalars().all()]
```

Update `backend/src/api/router.py` imports and include order:

```python
from src.api import achievements, coach, dashboard, educations, gaps, interactive_analysis, jd, pipeline_stream, profile, projects, resumes, role_analyze, roles, stories, suggestions, work_experiences
```

Then register the router:

```python
api_router.include_router(coach.router)
```

- [ ] **Step 4: Run the API tests to verify they pass**

Run:

```bash
cd backend && python -m pytest tests/test_api/test_coach_api.py -v
```

Expected:

```text
tests/test_api/test_coach_api.py::test_get_latest_coach_assessment_returns_null_when_service_has_no_snapshot PASSED
tests/test_api/test_coach_api.py::test_refresh_coach_assessment_returns_snapshot PASSED
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/api/coach.py backend/src/api/router.py backend/src/services/coach_service.py backend/tests/test_api/test_coach_api.py
git commit -m "feat(coach): expose capability assessment api"
```

### Task 4: Add Frontend Data Contracts and Route Shell

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/hooks/useCoach.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/pages/PerformanceCoach.tsx`
- Test: `frontend/src/pages/__tests__/PerformanceCoach.test.tsx`

- [ ] **Step 1: Write a failing route-shell test**

Create `frontend/src/pages/__tests__/PerformanceCoach.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { PerformanceCoach } from "../PerformanceCoach";

vi.mock("@/hooks/useCoach", () => ({
  useLatestCoachAssessment: () => ({
    data: null,
    isLoading: false,
    isError: false,
  }),
  useRefreshCoachAssessment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe("PerformanceCoach route shell", () => {
  it("renders the page title and phase tabs", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/coach"]}>
          <Routes>
            <Route path="/coach" element={<PerformanceCoach />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("绩效教练")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "能力总览" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "工作上下文" })).toBeDisabled();
    expect(screen.getByText("当前还没有能力评估快照")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run:

```bash
cd frontend && npm run test -- src/pages/__tests__/PerformanceCoach.test.tsx
```

Expected:

```text
Error: Failed to resolve import "../PerformanceCoach"
```

- [ ] **Step 3: Add frontend types, API client, and hooks**

Append these types to `frontend/src/types/index.ts`:

```ts
export interface CapabilityDimensionAssessment {
  level: string;
  status: "proven" | "partial" | "unproven";
  summary: string;
  evidence_count: number;
}

export interface CapabilityEvidenceLink {
  source_type: string;
  source_id: string;
  title: string;
  summary: string;
  dimensions: string[];
}

export interface CapabilityAssessment {
  id: string;
  profile_id: string;
  assessment_scope: string;
  core_level: string;
  core_reasoning_markdown: string;
  dimension_levels: Record<string, CapabilityDimensionAssessment>;
  evidence_links: CapabilityEvidenceLink[];
  next_level_gaps: string[];
  suggested_actions: string[];
  created_at: string;
  updated_at: string;
}
```

Append to `frontend/src/lib/api.ts`:

```ts
// ── Coach APIs ─────────────────────────────────────────
export const coachApi = {
  latestAssessment: () => apiClient.get("/coach/assessment/latest"),
  listAssessments: () => apiClient.get("/coach/assessments"),
  refreshAssessment: () => apiClient.post("/coach/assessment/refresh"),
};
```

Create `frontend/src/hooks/useCoach.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { coachApi } from "@/lib/api";
import type { CapabilityAssessment } from "@/types";

export function useLatestCoachAssessment() {
  return useQuery<CapabilityAssessment | null>({
    queryKey: ["coach", "latest-assessment"],
    queryFn: async () => {
      const { data } = await coachApi.latestAssessment();
      return data;
    },
  });
}

export function useCoachAssessmentHistory() {
  return useQuery<CapabilityAssessment[]>({
    queryKey: ["coach", "assessment-history"],
    queryFn: async () => {
      const { data } = await coachApi.listAssessments();
      return data;
    },
  });
}

export function useRefreshCoachAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await coachApi.refreshAssessment();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach"] });
    },
  });
}
```

- [ ] **Step 4: Add the route, sidebar entry, and page shell**

Update `frontend/src/App.tsx`:

```tsx
import { PerformanceCoach } from "@/pages/PerformanceCoach";
```

And add the route:

```tsx
              <Route path="/coach" element={<PerformanceCoach />} />
```

Update `frontend/src/components/layout/Sidebar.tsx` imports:

```tsx
  Trophy,
```

Add the nav item:

```tsx
  { to: "/coach", label: "绩效教练", icon: Trophy },
```

Create `frontend/src/pages/PerformanceCoach.tsx`:

```tsx
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { useLatestCoachAssessment, useRefreshCoachAssessment } from "@/hooks/useCoach";

const TABS = [
  { key: "overview", label: "能力总览", disabled: false },
  { key: "context", label: "工作上下文", disabled: true },
  { key: "okr", label: "个人 OKR", disabled: true },
  { key: "weekly", label: "周报复盘", disabled: true },
] as const;

export function PerformanceCoach() {
  const { data, isLoading, isError } = useLatestCoachAssessment();
  const refreshAssessment = useRefreshCoachAssessment();

  return (
    <>
      <Header
        title="绩效教练"
        description="基于五维模型评估你当前已经被证明达到的能力层级。"
        actions={
          <button
            className="rounded-md bg-notion-blue px-3 py-2 text-sm font-semibold text-white"
            onClick={() => refreshAssessment.mutate()}
            disabled={refreshAssessment.isPending}
          >
            {refreshAssessment.isPending ? "评估中..." : "重新评估"}
          </button>
        }
      />
      <PageContainer className="space-y-6">
        <div className="flex items-center gap-2 border-b pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={tab.key === "overview"}
              disabled={tab.disabled}
              className="rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && <div className="rounded-lg border bg-white p-8">正在加载能力评估...</div>}
        {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-8">能力评估加载失败。</div>}
        {!isLoading && !isError && !data && (
          <div className="rounded-lg border bg-white p-8">当前还没有能力评估快照。</div>
        )}
        {!isLoading && !isError && data && (
          <div data-testid="coach-overview-slot" className="rounded-lg border bg-white p-8">
            coach overview pending composition
          </div>
        )}
      </PageContainer>
    </>
  );
}
```

- [ ] **Step 5: Run the route-shell test to verify it passes**

Run:

```bash
cd frontend && npm run test -- src/pages/__tests__/PerformanceCoach.test.tsx
```

Expected:

```text
 ✓ src/pages/__tests__/PerformanceCoach.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/api.ts frontend/src/hooks/useCoach.ts frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx frontend/src/pages/PerformanceCoach.tsx frontend/src/pages/__tests__/PerformanceCoach.test.tsx
git commit -m "feat(coach): add frontend coach route shell"
```

### Task 5: Build the Capability Overview UI

**Files:**
- Create: `frontend/src/components/coach/CoachOverview.tsx`
- Create: `frontend/src/components/coach/CoreLevelCard.tsx`
- Create: `frontend/src/components/coach/CapabilityRadar.tsx`
- Create: `frontend/src/components/coach/EvidenceReasonList.tsx`
- Create: `frontend/src/components/coach/NextGapChecklist.tsx`
- Create: `frontend/src/components/coach/CoachAdviceRail.tsx`
- Modify: `frontend/src/pages/PerformanceCoach.tsx`
- Test: `frontend/src/pages/__tests__/PerformanceCoach.test.tsx`

- [ ] **Step 1: Extend the frontend test with a failing overview render assertion**

Replace the mock in `frontend/src/pages/__tests__/PerformanceCoach.test.tsx` with assessment data:

```tsx
vi.mock("@/hooks/useCoach", () => ({
  useLatestCoachAssessment: () => ({
    data: {
      id: "coach-1",
      profile_id: "profile-1",
      assessment_scope: "full_refresh",
      core_level: "C1",
      core_reasoning_markdown: "稳定交付证据已满足 C1。",
      dimension_levels: {
        execution_delivery: {
          level: "L2",
          status: "proven",
          summary: "连续形成明确结果。",
          evidence_count: 2,
        },
        breakthrough_problem_solving: {
          level: "L1",
          status: "partial",
          summary: "具备问题定位证据。",
          evidence_count: 1,
        },
      },
      evidence_links: [
        {
          source_type: "achievement",
          source_id: "ach-1",
          title: "修复训练链路回归问题",
          summary: "训练成功率提升到 99%",
          dimensions: ["execution_delivery", "breakthrough_problem_solving"],
        },
      ],
      next_level_gaps: ["缺少 owner 级模块闭环证据"],
      suggested_actions: ["把修复经验沉淀成可复用运行手册"],
      created_at: "2026-04-19T00:00:00Z",
      updated_at: "2026-04-19T00:00:00Z",
    },
    isLoading: false,
    isError: false,
  }),
  useRefreshCoachAssessment: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));
```

Add these assertions:

```tsx
    expect(screen.getByText("当前被证明达到")).toBeInTheDocument();
    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(screen.getByText("修复训练链路回归问题")).toBeInTheDocument();
    expect(screen.getByText("缺少 owner 级模块闭环证据")).toBeInTheDocument();
    expect(screen.getByText("把修复经验沉淀成可复用运行手册")).toBeInTheDocument();
```

- [ ] **Step 2: Run the frontend test to verify it fails**

Run:

```bash
cd frontend && npm run test -- src/pages/__tests__/PerformanceCoach.test.tsx
```

Expected:

```text
Unable to find an element with the text: 当前被证明达到
```

- [ ] **Step 3: Create focused coach overview components**

Create `frontend/src/components/coach/CoreLevelCard.tsx`:

```tsx
import type { CapabilityAssessment } from "@/types";

export function CoreLevelCard({ assessment }: { assessment: CapabilityAssessment }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-notion-gray-500">当前被证明达到</div>
      <div className="mt-3 flex items-end gap-3">
        <div className="rounded-2xl bg-notion-blue px-4 py-2 text-3xl font-extrabold text-white">
          {assessment.core_level}
        </div>
        <p className="text-sm leading-6 text-notion-gray-500">
          {assessment.core_reasoning_markdown}
        </p>
      </div>
    </section>
  );
}
```

Create `frontend/src/components/coach/CapabilityRadar.tsx`:

```tsx
import type { CapabilityAssessment } from "@/types";

const DIMENSIONS = [
  ["exploration_innovation", "探索创新"],
  ["execution_delivery", "高执行力"],
  ["core_backbone", "核心骨干"],
  ["breakthrough_problem_solving", "攻坚突破"],
  ["collaboration_influence", "协调赋能"],
] as const;

const LEVEL_TO_SCORE: Record<string, number> = {
  "未证明": 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

function polar(cx: number, cy: number, r: number, angle: number) {
  const radians = (angle - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(radians), cy + r * Math.sin(radians)];
}

export function CapabilityRadar({ assessment }: { assessment: CapabilityAssessment }) {
  const points = DIMENSIONS.map(([key], index) => {
    const score = LEVEL_TO_SCORE[assessment.dimension_levels[key]?.level ?? "未证明"];
    const [x, y] = polar(110, 110, 22 * score, index * 72);
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">五维画像</div>
      <div className="mt-4 flex items-center gap-8">
        <svg viewBox="0 0 220 220" className="h-56 w-56">
          <polygon points="110,22 193,83 161,182 59,182 27,83" fill="#f7f7f5" stroke="#d6d3d1" />
          <polygon points={points} fill="rgba(51, 112, 255, 0.18)" stroke="#3370ff" strokeWidth="3" />
        </svg>
        <div className="space-y-3">
          {DIMENSIONS.map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-6 text-sm">
              <span className="text-notion-gray-500">{label}</span>
              <span className="font-semibold text-foreground">
                {assessment.dimension_levels[key]?.level ?? "未证明"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Create `frontend/src/components/coach/EvidenceReasonList.tsx`:

```tsx
import type { CapabilityAssessment } from "@/types";

export function EvidenceReasonList({ assessment }: { assessment: CapabilityAssessment }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">等级解释</div>
      <div className="mt-4 space-y-3">
        {assessment.evidence_links.map((item) => (
          <div key={item.source_id} className="rounded-lg bg-notion-warm-white px-4 py-3">
            <div className="font-medium text-foreground">{item.title}</div>
            <div className="mt-1 text-sm text-notion-gray-500">{item.summary}</div>
            <div className="mt-2 text-xs text-notion-blue">
              支持维度：{item.dimensions.join(" / ")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Create `frontend/src/components/coach/NextGapChecklist.tsx`:

```tsx
import type { CapabilityAssessment } from "@/types";

export function NextGapChecklist({ assessment }: { assessment: CapabilityAssessment }) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">下一等级缺口</div>
      <ul className="mt-4 space-y-2 text-sm text-notion-gray-500">
        {assessment.next_level_gaps.map((gap) => (
          <li key={gap} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
            <span>{gap}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Create `frontend/src/components/coach/CoachAdviceRail.tsx`:

```tsx
import type { CapabilityAssessment } from "@/types";

export function CoachAdviceRail({ assessment }: { assessment: CapabilityAssessment }) {
  return (
    <aside className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-foreground">教练建议栏</div>
      <div className="mt-4 space-y-3">
        {assessment.suggested_actions.map((action) => (
          <div key={action} className="rounded-lg border border-dashed border-notion-blue/30 px-3 py-3 text-sm text-notion-gray-500">
            {action}
          </div>
        ))}
      </div>
    </aside>
  );
}
```

Create `frontend/src/components/coach/CoachOverview.tsx`:

```tsx
import type { CapabilityAssessment } from "@/types";

import { CoachAdviceRail } from "./CoachAdviceRail";
import { CapabilityRadar } from "./CapabilityRadar";
import { CoreLevelCard } from "./CoreLevelCard";
import { EvidenceReasonList } from "./EvidenceReasonList";
import { NextGapChecklist } from "./NextGapChecklist";

export function CoachOverview({ assessment }: { assessment: CapabilityAssessment }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-6">
        <CoreLevelCard assessment={assessment} />
        <CapabilityRadar assessment={assessment} />
        <EvidenceReasonList assessment={assessment} />
        <NextGapChecklist assessment={assessment} />
      </div>
      <CoachAdviceRail assessment={assessment} />
    </div>
  );
}
```

- [ ] **Step 4: Integrate the real overview into the page**

Update `frontend/src/pages/PerformanceCoach.tsx` imports:

```tsx
import { CoachOverview } from "@/components/coach/CoachOverview";
```

Replace the temporary overview block with:

```tsx
        {!isLoading && !isError && data && <CoachOverview assessment={data} />}
```

- [ ] **Step 5: Run the frontend test to verify it passes**

Run:

```bash
cd frontend && npm run test -- src/pages/__tests__/PerformanceCoach.test.tsx
```

Expected:

```text
 ✓ src/pages/__tests__/PerformanceCoach.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/coach/CoachOverview.tsx frontend/src/components/coach/CoreLevelCard.tsx frontend/src/components/coach/CapabilityRadar.tsx frontend/src/components/coach/EvidenceReasonList.tsx frontend/src/components/coach/NextGapChecklist.tsx frontend/src/components/coach/CoachAdviceRail.tsx frontend/src/pages/PerformanceCoach.tsx frontend/src/pages/__tests__/PerformanceCoach.test.tsx
git commit -m "feat(coach): build capability overview ui"
```

### Task 6: Verify the Phase 1 Slice End-to-End

**Files:**
- Modify only if verification uncovers real defects in the files above

- [ ] **Step 1: Run the targeted backend tests**

Run:

```bash
cd backend && python -m pytest tests/test_services/test_coach_service.py tests/test_api/test_coach_api.py -v
```

Expected:

```text
4 passed
```

- [ ] **Step 2: Run the targeted frontend test**

Run:

```bash
cd frontend && npm run test -- src/pages/__tests__/PerformanceCoach.test.tsx
```

Expected:

```text
 ✓ src/pages/__tests__/PerformanceCoach.test.tsx
```

- [ ] **Step 3: Run backend lint**

Run:

```bash
cd backend && ruff check src/ tests/
```

Expected:

```text
All checks passed!
```

- [ ] **Step 4: Run frontend lint and build**

Run:

```bash
cd frontend && npm run lint && npm run build
```

Expected:

```text
eslint .  # exits 0
vite build  # exits 0
```

- [ ] **Step 5: Commit any verification-only fixes**

```bash
git add backend/src/api/coach.py backend/src/core/llm.py backend/src/models/capability_assessment.py backend/src/models/__init__.py backend/src/prompts/capability_assessment.py backend/src/schemas/coach.py backend/src/services/coach_service.py backend/tests/test_api/test_coach_api.py backend/tests/test_services/test_coach_service.py backend/alembic/versions/20260419_02_add_capability_assessment_snapshots.py frontend/src/App.tsx frontend/src/components/coach/CoachAdviceRail.tsx frontend/src/components/coach/CoachOverview.tsx frontend/src/components/coach/CapabilityRadar.tsx frontend/src/components/coach/CoreLevelCard.tsx frontend/src/components/coach/EvidenceReasonList.tsx frontend/src/components/coach/NextGapChecklist.tsx frontend/src/components/layout/Sidebar.tsx frontend/src/hooks/useCoach.ts frontend/src/lib/api.ts frontend/src/pages/PerformanceCoach.tsx frontend/src/pages/__tests__/PerformanceCoach.test.tsx frontend/src/types/index.ts
git commit -m "chore(coach): verify phase 1 capability overview"
```

---

## Follow-On Planning Note

After this Phase 1 plan is implemented and merged, write separate plans for:

1. `Phase 2` work context items, tasks, and progress entries
2. `Phase 3` personal OKRs and weekly action generation
3. `Phase 4` weekly report generation, reflection, and incremental re-rating
