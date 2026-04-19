"""Tests for personal OKR API endpoints."""

from __future__ import annotations

from datetime import datetime, UTC
import uuid
from typing import List

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.schemas.personal_okr import (
    PersonalObjectiveResponse,
    PersonalKeyResultResponse,
    WeeklyActionSuggestionsResponse,
    WeeklyActionSuggestion,
)

def _mock_objective(id: uuid.UUID, title: str) -> PersonalObjectiveResponse:
    now = datetime.now(UTC)
    return PersonalObjectiveResponse(
        id=id,
        profile_id=uuid.uuid4(),
        title=title,
        summary="Test summary",
        status="draft",
        target_core_level="C2",
        linked_dimensions_json=["Dimension A"],
        key_results=[],
        created_at=now,
        updated_at=now,
    )

def _mock_kr(id: uuid.UUID, objective_id: uuid.UUID, title: str) -> PersonalKeyResultResponse:
    now = datetime.now(UTC)
    return PersonalKeyResultResponse(
        id=id,
        objective_id=objective_id,
        title=title,
        result_definition="Test definition",
        status="active",
        progress_value_json={},
        linked_context_item_ids=[],
        linked_evidence_ids=[],
        created_at=now,
        updated_at=now,
    )

@pytest.mark.asyncio
async def test_list_okrs(monkeypatch: pytest.MonkeyPatch):
    from src.services import personal_okr_service
    
    obj_id = uuid.uuid4()
    async def fake_list(*args, **kwargs):
        return [_mock_objective(obj_id, "Test OKR")]

    monkeypatch.setattr(personal_okr_service, "list_objectives", fake_list)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/coach/okrs")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["title"] == "Test OKR"
    assert payload[0]["id"] == str(obj_id)

@pytest.mark.asyncio
async def test_create_okr(monkeypatch: pytest.MonkeyPatch):
    from src.services import personal_okr_service
    
    obj_id = uuid.uuid4()
    async def fake_create(*args, **kwargs):
        return _mock_objective(obj_id, "New OKR")

    monkeypatch.setattr(personal_okr_service, "create_objective", fake_create)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/coach/okrs", json={"title": "New OKR"})

    assert response.status_code == 201
    payload = response.json()
    assert payload["title"] == "New OKR"
    assert payload["id"] == str(obj_id)

@pytest.mark.asyncio
async def test_update_okr(monkeypatch: pytest.MonkeyPatch):
    from src.services import personal_okr_service
    
    obj_id = uuid.uuid4()
    async def fake_update(*args, **kwargs):
        return _mock_objective(obj_id, "Updated OKR")

    monkeypatch.setattr(personal_okr_service, "update_objective", fake_update)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.patch(f"/api/coach/okrs/{obj_id}", json={"title": "Updated OKR"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Updated OKR"

@pytest.mark.asyncio
async def test_create_key_result(monkeypatch: pytest.MonkeyPatch):
    from src.services import personal_okr_service
    
    obj_id = uuid.uuid4()
    kr_id = uuid.uuid4()
    async def fake_create_kr(*args, **kwargs):
        return _mock_kr(kr_id, obj_id, "New KR")

    monkeypatch.setattr(personal_okr_service, "create_key_result", fake_create_kr)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(f"/api/coach/okrs/{obj_id}/key-results", json={"title": "New KR"})

    assert response.status_code == 201
    payload = response.json()
    assert payload["title"] == "New KR"
    assert payload["objective_id"] == str(obj_id)

@pytest.mark.asyncio
async def test_update_key_result(monkeypatch: pytest.MonkeyPatch):
    from src.services import personal_okr_service
    
    kr_id = uuid.uuid4()
    obj_id = uuid.uuid4()
    async def fake_update_kr(*args, **kwargs):
        return _mock_kr(kr_id, obj_id, "Updated KR")

    monkeypatch.setattr(personal_okr_service, "update_key_result", fake_update_kr)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.patch(f"/api/coach/key-results/{kr_id}", json={"title": "Updated KR"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["title"] == "Updated KR"

@pytest.mark.asyncio
async def test_get_weekly_action_suggestions(monkeypatch: pytest.MonkeyPatch):
    from src.services import personal_okr_service
    
    async def fake_suggest(*args, **kwargs):
        return WeeklyActionSuggestionsResponse(
            suggestions=[
                WeeklyActionSuggestion(
                    title="Action 1",
                    description="Do something",
                    priority="high"
                )
            ],
            reasoning="Because tests"
        )

    monkeypatch.setattr(personal_okr_service, "suggest_weekly_actions", fake_suggest)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/coach/weekly-actions")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["suggestions"]) == 1
    assert payload["suggestions"][0]["title"] == "Action 1"
    assert payload["reasoning"] == "Because tests"
