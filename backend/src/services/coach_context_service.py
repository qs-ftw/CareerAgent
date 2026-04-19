from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.models.coach_context import (
    PerformanceContextItem,
    PerformanceTask,
    PerformanceProgressEntry
)
from src.schemas.coach_context import (
    PerformanceContextItemCreate,
    PerformanceContextItemUpdate,
    PerformanceTaskCreate,
    PerformanceTaskUpdate,
    PerformanceProgressEntryCreate,
    PerformanceProgressEntryUpdate
)

async def create_context_item(
    db: AsyncSession,
    profile_id: UUID,
    obj_in: PerformanceContextItemCreate
) -> PerformanceContextItem:
    db_obj = PerformanceContextItem(
        profile_id=profile_id,
        **obj_in.model_dump(mode="json")
    )
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_context_items_for_profile(
    db: AsyncSession,
    profile_id: UUID
) -> List[PerformanceContextItem]:
    stmt = select(PerformanceContextItem).where(
        PerformanceContextItem.profile_id == profile_id
    ).order_by(PerformanceContextItem.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_context_item(db: AsyncSession, profile_id: UUID, item_id: UUID) -> Optional[PerformanceContextItem]:
    stmt = select(PerformanceContextItem).where(
        PerformanceContextItem.id == item_id,
        PerformanceContextItem.profile_id == profile_id
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def update_context_item(
    db: AsyncSession,
    profile_id: UUID,
    item_id: UUID,
    obj_in: PerformanceContextItemUpdate
) -> Optional[PerformanceContextItem]:
    db_obj = await get_context_item(db, profile_id, item_id)
    if not db_obj:
        return None
    
    update_data = obj_in.model_dump(exclude_unset=True, mode="json")
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_task(db: AsyncSession, task_id: UUID) -> Optional[PerformanceTask]:
    stmt = select(PerformanceTask).where(
        PerformanceTask.id == task_id
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_task_for_context(
    db: AsyncSession,
    context_item_id: UUID,
    obj_in: PerformanceTaskCreate
) -> PerformanceTask:
    db_obj = PerformanceTask(
        context_item_id=context_item_id,
        **obj_in.model_dump()
    )
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_tasks_for_context(
    db: AsyncSession,
    context_item_id: UUID
) -> List[PerformanceTask]:
    stmt = select(PerformanceTask).where(
        PerformanceTask.context_item_id == context_item_id
    ).order_by(PerformanceTask.sort_order.asc(), PerformanceTask.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def update_task(
    db: AsyncSession,
    task_id: UUID,
    obj_in: PerformanceTaskUpdate
) -> Optional[PerformanceTask]:
    db_obj = await get_task(db, task_id)
    if not db_obj:
        return None
        
    update_data = obj_in.model_dump(exclude_unset=True, mode="json")
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_progress_entry(db: AsyncSession, entry_id: UUID) -> Optional[PerformanceProgressEntry]:
    stmt = select(PerformanceProgressEntry).where(
        PerformanceProgressEntry.id == entry_id
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_progress_entry(
    db: AsyncSession,
    context_item_id: UUID,
    obj_in: PerformanceProgressEntryCreate
) -> PerformanceProgressEntry:
    db_obj = PerformanceProgressEntry(
        context_item_id=context_item_id,
        **obj_in.model_dump()
    )
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj

async def get_progress_entries_for_context(
    db: AsyncSession,
    context_item_id: UUID
) -> List[PerformanceProgressEntry]:
    stmt = select(PerformanceProgressEntry).where(
        PerformanceProgressEntry.context_item_id == context_item_id
    ).order_by(PerformanceProgressEntry.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def update_progress_entry(
    db: AsyncSession,
    entry_id: UUID,
    obj_in: PerformanceProgressEntryUpdate
) -> Optional[PerformanceProgressEntry]:
    db_obj = await get_progress_entry(db, entry_id)
    if not db_obj:
        return None
        
    update_data = obj_in.model_dump(exclude_unset=True, mode="json")
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    await db.flush()
    await db.refresh(db_obj)
    return db_obj
