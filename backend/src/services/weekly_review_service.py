import uuid
import json
from datetime import date, datetime
from typing import List, Optional, Dict, Any

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.weekly_review import WeeklyReviewRun
from src.models.coach_context import PerformanceProgressEntry, PerformanceContextItem
from src.models.achievement import Achievement
from src.models.story import InterviewStory
from src.models.profile import CareerProfile
from src.services import coach_service
from src.core.llm import get_llm
from src.prompts.weekly_review import render_weekly_review_prompt

async def generate_weekly_review(
    db: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    week_start: date,
    week_end: date,
) -> WeeklyReviewRun:
    """
    Generate a weekly review report and trigger a capability assessment refresh.
    """
    # 1. Get profile
    stmt = select(CareerProfile).where(
        CareerProfile.user_id == user_id,
        CareerProfile.workspace_id == workspace_id
    )
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if not profile:
        raise ValueError("Profile not found")

    # 2. Aggregate evidence
    dt_start = datetime.combine(week_start, datetime.min.time())
    dt_end = datetime.combine(week_end, datetime.max.time())

    # Progress Entries
    stmt = select(PerformanceProgressEntry).join(PerformanceContextItem).where(
        PerformanceContextItem.profile_id == profile.id,
        PerformanceProgressEntry.occurred_at >= dt_start,
        PerformanceProgressEntry.occurred_at <= dt_end
    )
    result = await db.execute(stmt)
    progress_entries = result.scalars().all()

    # Achievements (using created_at for "new" achievements this week)
    stmt = select(Achievement).where(
        Achievement.profile_id == profile.id,
        Achievement.created_at >= dt_start,
        Achievement.created_at <= dt_end
    )
    result = await db.execute(stmt)
    achievements = result.scalars().all()

    # Interview Stories (using updated_at for "new/updated" stories this week)
    stmt = select(InterviewStory).where(
        InterviewStory.user_id == user_id,
        InterviewStory.workspace_id == workspace_id,
        InterviewStory.updated_at >= dt_start,
        InterviewStory.updated_at <= dt_end
    )
    result = await db.execute(stmt)
    stories = result.scalars().all()

    # 3. Build evidence pack for LLM and storage
    new_evidence = []
    for e in progress_entries:
        new_evidence.append({
            "type": "progress_entry",
            "id": str(e.id),
            "title": e.title,
            "details": e.details_markdown,
            "result": e.result_summary,
            "occurred_at": e.occurred_at.isoformat() if e.occurred_at else None
        })
    for a in achievements:
        new_evidence.append({
            "type": "achievement",
            "id": str(a.id),
            "title": a.title,
            "content": a.raw_content,
            "created_at": a.created_at.isoformat()
        })
    for s in stories:
        new_evidence.append({
            "type": "story",
            "id": str(s.id),
            "question": s.question_text,
            "answer": s.answer_markdown,
            "updated_at": s.updated_at.isoformat()
        })

    evidence_pack = {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "evidence_items": new_evidence
    }

    # 4. Use LLM to generate report
    manager_report = ""
    suggested_actions = []
    
    if new_evidence:
        llm = get_llm("weekly_review_generator")
        prompt = render_weekly_review_prompt(evidence_pack)
        response = await llm.ainvoke(prompt)
        
        try:
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            data = json.loads(content)
            manager_report = data.get("manager_report_markdown", "")
            suggested_actions = data.get("suggested_next_actions_json", [])
        except Exception:
            manager_report = "Error generating report from LLM response."
            suggested_actions = []
    else:
        manager_report = "No new evidence recorded this week."

    # 5. Call coach_service.refresh_assessment_sync to update capability rating
    assessment_snapshot = await coach_service.refresh_assessment_sync(db, user_id, workspace_id)
    assessment_snapshot_id = assessment_snapshot.id if assessment_snapshot else None

    # 6. Save WeeklyReviewRun
    review_run = WeeklyReviewRun(
        profile_id=profile.id,
        week_start=week_start,
        week_end=week_end,
        manager_report_markdown=manager_report,
        new_evidence_json=new_evidence,
        suggested_next_actions_json=suggested_actions,
        assessment_snapshot_id=assessment_snapshot_id
    )
    db.add(review_run)
    await db.commit()
    await db.refresh(review_run)
    
    return review_run

async def get_weekly_reviews(
    db: AsyncSession,
    profile_id: uuid.UUID
) -> List[WeeklyReviewRun]:
    stmt = select(WeeklyReviewRun).where(
        WeeklyReviewRun.profile_id == profile_id
    ).order_by(WeeklyReviewRun.week_start.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())

async def get_weekly_review(
    db: AsyncSession,
    review_id: uuid.UUID
) -> Optional[WeeklyReviewRun]:
    stmt = select(WeeklyReviewRun).where(WeeklyReviewRun.id == review_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

async def update_weekly_review(
    db: AsyncSession,
    review_id: uuid.UUID,
    review_in: Any # Should be WeeklyReviewUpdate from schemas
) -> Optional[WeeklyReviewRun]:
    review = await get_weekly_review(db, review_id)
    if not review:
        return None
    
    update_data = review_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    await db.commit()
    await db.refresh(review)
    return review
