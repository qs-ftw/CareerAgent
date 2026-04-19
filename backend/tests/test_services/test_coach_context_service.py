import uuid
import pytest
from src.core.database import AsyncSessionLocal
from src.services import coach_context_service, profile_service
from src.schemas.coach_context import (
    PerformanceContextItemCreate,
    PerformanceContextItemUpdate,
    PerformanceTaskCreate,
    PerformanceTaskUpdate,
    PerformanceProgressEntryCreate,
    PerformanceProgressEntryUpdate
)
from src.schemas.profile import CareerProfileUpsert

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

@pytest.mark.asyncio
async def test_coach_context_item_crud():
    async with AsyncSessionLocal() as session:
        # 1. Setup: Create a profile
        profile_payload = CareerProfileUpsert(name="Test User")
        profile = await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, profile_payload)
        await session.commit()
        profile_id = profile.id

        # 2. Create Context Item
        item_in = PerformanceContextItemCreate(
            title="Q2 Promotion Plan",
            summary="Steps to achieve Senior Engineer",
            priority="high"
        )
        item = await coach_context_service.create_context_item(session, profile_id, item_in)
        assert item.title == "Q2 Promotion Plan"
        assert item.profile_id == profile_id

        # 3. Get Context Items
        items = await coach_context_service.get_context_items_for_profile(session, profile_id)
        assert len(items) >= 1
        assert items[0].id == item.id

        # 4. Update Context Item
        update_in = PerformanceContextItemUpdate(status="completed", priority="medium")
        updated_item = await coach_context_service.update_context_item(session, profile_id, item.id, update_in)
        assert updated_item.status == "completed"
        assert updated_item.priority == "medium"

@pytest.mark.asyncio
async def test_coach_task_crud():
    async with AsyncSessionLocal() as session:
        # Setup: Create a profile and a context item
        profile_payload = CareerProfileUpsert(name="Task User")
        profile = await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, profile_payload)
        await session.commit()
        
        item_in = PerformanceContextItemCreate(title="Task Context")
        item = await coach_context_service.create_context_item(session, profile.id, item_in)
        
        # 1. Create Task
        task_in = PerformanceTaskCreate(title="First Task", description="To be done")
        task = await coach_context_service.create_task_for_context(session, item.id, task_in)
        assert task.title == "First Task"
        assert task.context_item_id == item.id

        # 2. Get Tasks
        tasks = await coach_context_service.get_tasks_for_context(session, item.id)
        assert len(tasks) == 1
        assert tasks[0].id == task.id

        # 3. Update Task
        task_update = PerformanceTaskUpdate(status="done")
        updated_task = await coach_context_service.update_task(session, item.id, task.id, task_update)
        assert updated_task.status == "done"

@pytest.mark.asyncio
async def test_coach_progress_entry_crud():
    async with AsyncSessionLocal() as session:
        # Setup: Create a profile and a context item
        profile_payload = CareerProfileUpsert(name="Progress User")
        profile = await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, profile_payload)
        await session.commit()
        
        item_in = PerformanceContextItemCreate(title="Progress Context")
        item = await coach_context_service.create_context_item(session, profile.id, item_in)
        
        # 1. Create Progress Entry
        entry_in = PerformanceProgressEntryCreate(
            title="Meeting with Manager",
            details_markdown="Discussed feedback",
            result_summary="Positive overall"
        )
        entry = await coach_context_service.create_progress_entry(session, item.id, entry_in)
        assert entry.title == "Meeting with Manager"
        assert entry.context_item_id == item.id

        # 2. Get Progress Entries
        entries = await coach_context_service.get_progress_entries_for_context(session, item.id)
        assert len(entries) == 1
        assert entries[0].id == entry.id

        # 3. Update Progress Entry
        entry_update = PerformanceProgressEntryUpdate(status="reviewed")
        updated_entry = await coach_context_service.update_progress_entry(session, item.id, entry.id, entry_update)
        assert updated_entry.status == "reviewed"
