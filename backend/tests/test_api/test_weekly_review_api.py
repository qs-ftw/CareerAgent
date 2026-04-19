"""Tests for weekly review API endpoints."""

from __future__ import annotations

from datetime import date, datetime
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.schemas.weekly_review import WeeklyReviewResponse

def _review() -> WeeklyReviewResponse:
    now = datetime.fromisoformat("2026-04-20T00:00:00+00:00")
    return WeeklyReviewResponse(
        id=uuid.uuid4(),
        profile_id=uuid.uuid4(),
        week_start=date(2026, 4, 13),
        week_end=date(2026, 4, 19),
        manager_report_markdown="Manager report content",
        self_reflection_markdown="Self reflection content",
        new_evidence_json=[],
        suggested_next_actions_json=[],
        assessment_snapshot_id=uuid.uuid4(),
        created_at=now,
        updated_at=now,
    )

@pytest.mark.asyncio
async def test_generate_weekly_review(monkeypatch: pytest.MonkeyPatch):
    from src.services import weekly_review_service

    async def fake_generate(*args, **kwargs):
        return _review()

    monkeypatch.setattr(weekly_review_service, "generate_weekly_review", fake_generate)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            "/api/coach/weekly-reviews/generate",
            json={"week_start": "2026-04-13", "week_end": "2026-04-19"}
        )

    assert response.status_code == 200
    assert response.json()["manager_report_markdown"] == "Manager report content"

@pytest.mark.asyncio
async def test_list_weekly_reviews(monkeypatch: pytest.MonkeyPatch):
    from src.services import weekly_review_service, profile_service

    async def fake_list(*args, **kwargs):
        return [_review()]
    
    class FakeProfile:
        id = uuid.uuid4()

    async def fake_get_profile(*args, **kwargs):
        return FakeProfile()

    monkeypatch.setattr(weekly_review_service, "get_weekly_reviews", fake_list)
    monkeypatch.setattr(profile_service, "get_profile", fake_get_profile)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/coach/weekly-reviews")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["manager_report_markdown"] == "Manager report content"

@pytest.mark.asyncio
async def test_get_weekly_review(monkeypatch: pytest.MonkeyPatch):
    from src.services import weekly_review_service

    review = _review()
    async def fake_get(*args, **kwargs):
        return review

    monkeypatch.setattr(weekly_review_service, "get_weekly_review", fake_get)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/coach/weekly-reviews/{review.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(review.id)

@pytest.mark.asyncio
async def test_get_weekly_review_not_found(monkeypatch: pytest.MonkeyPatch):
    from src.services import weekly_review_service

    async def fake_get(*args, **kwargs):
        return None

    monkeypatch.setattr(weekly_review_service, "get_weekly_review", fake_get)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/coach/weekly-reviews/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Weekly review not found"
