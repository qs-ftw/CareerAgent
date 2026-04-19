"""Tests for coach context API endpoints."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.mark.asyncio
async def test_coach_context_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Ensure profile exists (needed for context items)
        profile_resp = await client.put("/api/profile", json={
            "name": "Coach Tester",
            "headline": "Performance Specialist",
            "professional_summary": "Helping professionals reach their peak performance.",
            "skill_categories": {"Soft Skills": ["Leadership", "Time Management"]},
        })
        assert profile_resp.status_code == 200
        
        # 2. Create Context Item
        resp = await client.post("/api/coach/context-items", json={
            "title": "Boost Productivity",
            "summary": "Focus on high-impact tasks",
            "priority": "high"
        })
        assert resp.status_code == 201
        item = resp.json()
        item_id = item["id"]
        assert item["title"] == "Boost Productivity"
        assert item["priority"] == "high"
        
        # 3. List Context Items
        resp = await client.get("/api/coach/context-items")
        assert resp.status_code == 200
        items = resp.json()
        assert isinstance(items, list)
        assert any(i["id"] == item_id for i in items)
        
        # 4. Update Context Item
        resp = await client.patch(f"/api/coach/context-items/{item_id}", json={
            "summary": "Focus on high-impact tasks and delegation"
        })
        assert resp.status_code == 200
        updated_item = resp.json()
        assert updated_item["summary"] == "Focus on high-impact tasks and delegation"
        
        # 5. Create Task
        resp = await client.post(f"/api/coach/context-items/{item_id}/tasks", json={
            "title": "Morning Routine",
            "description": "Start with deep work",
            "status": "todo"
        })
        assert resp.status_code == 201
        task = resp.json()
        task_id = task["id"]
        assert task["context_item_id"] == item_id
        
        # 6. List Tasks
        resp = await client.get(f"/api/coach/context-items/{item_id}/tasks")
        assert resp.status_code == 200
        tasks = resp.json()
        assert isinstance(tasks, list)
        assert any(t["id"] == task_id for t in tasks)
        
        # 7. Update Task
        resp = await client.patch(f"/api/coach/tasks/{task_id}", json={
            "status": "done"
        })
        assert resp.status_code == 200
        updated_task = resp.json()
        assert updated_task["status"] == "done"
        
        # 8. Create Progress Entry
        resp = await client.post(f"/api/coach/context-items/{item_id}/progress", json={
            "title": "Week 1 Completed",
            "details_markdown": "Done all tasks",
            "status": "logged"
        })
        assert resp.status_code == 201
        entry = resp.json()
        entry_id = entry["id"]
        assert entry["context_item_id"] == item_id
        
        # 9. List Progress Entries
        resp = await client.get(f"/api/coach/context-items/{item_id}/progress")
        assert resp.status_code == 200
        entries = resp.json()
        assert isinstance(entries, list)
        assert any(e["id"] == entry_id for e in entries)
        
        # 10. Update Progress Entry
        resp = await client.patch(f"/api/coach/progress/{entry_id}", json={
            "result_summary": "Excellent progress"
        })
        assert resp.status_code == 200
        updated_entry = resp.json()
        assert updated_entry["result_summary"] == "Excellent progress"


@pytest.mark.asyncio
async def test_not_found_errors():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        fake_id = "00000000-0000-0000-0000-000000000000"
        
        # Context Item Not Found
        resp = await client.patch(f"/api/coach/context-items/{fake_id}", json={"title": "New"})
        assert resp.status_code == 404
        
        # Task Not Found
        resp = await client.patch(f"/api/coach/tasks/{fake_id}", json={"title": "New"})
        assert resp.status_code == 404
        
        # Progress Entry Not Found
        resp = await client.patch(f"/api/coach/progress/{fake_id}", json={"title": "New"})
        assert resp.status_code == 404
