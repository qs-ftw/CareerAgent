"""Tests for coach assessment API endpoints."""

from __future__ import annotations

from datetime import datetime
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.schemas.coach import CapabilityAssessmentResponse


def _snapshot(core_level: str) -> CapabilityAssessmentResponse:
    now = datetime.fromisoformat("2026-04-20T00:00:00+00:00")
    return CapabilityAssessmentResponse(
        id=uuid.uuid4(),
        profile_id=uuid.uuid4(),
        assessment_scope="full_refresh",
        core_level=core_level,
        core_reasoning_markdown=f"现有证据证明达到 {core_level}。",
        dimension_levels={},
        evidence_links=[],
        next_level_gaps=["缺少 owner 级模块证据"],
        suggested_actions=["补充一个模块 owner 闭环案例"],
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_get_latest_coach_assessment_returns_null_when_service_has_no_snapshot(
    monkeypatch: pytest.MonkeyPatch,
):
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
async def test_refresh_coach_assessment_returns_snapshot(
    monkeypatch: pytest.MonkeyPatch,
):
    from src.services import coach_service

    async def fake_refresh(*args, **kwargs):
        return _snapshot("C1")

    monkeypatch.setattr(coach_service, "refresh_assessment", fake_refresh)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/coach/assessment/refresh")

    assert response.status_code == 200
    assert response.json()["core_level"] == "C1"


@pytest.mark.asyncio
async def test_list_coach_assessments_returns_history(
    monkeypatch: pytest.MonkeyPatch,
):
    from src.services import coach_service

    async def fake_list(*args, **kwargs):
        return [_snapshot("C2"), _snapshot("C1")]

    monkeypatch.setattr(coach_service, "list_assessments", fake_list)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/coach/assessments")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 2
    assert payload[0]["core_level"] == "C2"
    assert payload[1]["core_level"] == "C1"
