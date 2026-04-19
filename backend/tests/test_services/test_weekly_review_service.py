import uuid
import pytest
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import delete

from src.core.database import AsyncSessionLocal
from src.models.weekly_review import WeeklyReviewRun
from src.models.coach_context import PerformanceProgressEntry, PerformanceContextItem
from src.models.achievement import Achievement
from src.models.story import InterviewStory
from src.models.profile import CareerProfile
from src.services import weekly_review_service, coach_service
from src.services.profile_service import upsert_profile
from src.schemas.profile import CareerProfileUpsert

USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

@pytest.mark.asyncio
async def test_generate_weekly_review_success(monkeypatch: pytest.MonkeyPatch):
    async with AsyncSessionLocal() as session:
        # 1. Setup profile
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Weekly Review Test Profile"),
        )
        
        # Cleanup
        await session.execute(delete(WeeklyReviewRun).where(WeeklyReviewRun.profile_id == profile.id))
        await session.execute(delete(PerformanceProgressEntry))
        await session.execute(delete(PerformanceContextItem).where(PerformanceContextItem.profile_id == profile.id))
        await session.execute(delete(Achievement).where(Achievement.profile_id == profile.id))
        await session.execute(delete(InterviewStory).where(InterviewStory.user_id == USER_ID))
        await session.commit()

        # 2. Setup evidence
        context_item = PerformanceContextItem(
            profile_id=profile.id,
            title="Test Context Item",
            status="active"
        )
        session.add(context_item)
        await session.flush()

        week_start = date.today() - timedelta(days=7)
        week_end = date.today()
        # Ensure occurred_at is within the week
        occurred_at = datetime.now(timezone.utc) - timedelta(days=2)

        progress_entry = PerformanceProgressEntry(
            context_item_id=context_item.id,
            title="Did something great",
            details_markdown="Details of doing something great",
            result_summary="Success",
            occurred_at=occurred_at
        )
        session.add(progress_entry)

        achievement = Achievement(
            profile_id=profile.id,
            title="New Achievement",
            raw_content="Achievement content",
            created_at=occurred_at
        )
        session.add(achievement)

        story = InterviewStory(
            workspace_id=WORKSPACE_ID,
            user_id=USER_ID,
            question_text="Tell me about a time...",
            answer_markdown="I did this...",
            updated_at=occurred_at
        )
        session.add(story)
        await session.commit()

        # 3. Mock LLM and coach_service.refresh_assessment
        class FakeLLM:
            async def ainvoke(self, prompt: str):
                return type("Response", (), {
                    "content": '{"manager_report_markdown": "Great week!", "suggested_next_actions_json": [{"title": "Keep it up", "reason": "Good work"}]}'
                })()

        monkeypatch.setattr(weekly_review_service, "get_llm", lambda name: FakeLLM())
        
        # Mock refresh_assessment with a real snapshot to satisfy foreign key constraint
        from src.schemas.coach import CapabilityAssessmentPersist
        payload = CapabilityAssessmentPersist(
            assessment_scope="full_refresh",
            core_level="C1",
            core_reasoning_markdown="reasoning",
            dimension_levels={},
            evidence_links=[],
            next_level_gaps=[],
            suggested_actions=[]
        )
        real_snapshot = await coach_service.save_assessment_snapshot(session, profile.id, payload)
        await session.flush() # Use flush instead of commit to keep it in transaction if needed, or commit if necessary
        
        async def fake_refresh_assessment(db, u_id, w_id):
            return real_snapshot
        
        monkeypatch.setattr(coach_service, "refresh_assessment_sync", fake_refresh_assessment)

        # 4. Run generate_weekly_review
        review = await weekly_review_service.generate_weekly_review(
            session, USER_ID, WORKSPACE_ID, week_start, week_end
        )

        # 5. Assertions
        assert review is not None
        assert review.profile_id == profile.id
        assert review.manager_report_markdown == "Great week!"
        assert len(review.new_evidence_json) == 3
        assert review.assessment_snapshot_id == real_snapshot.id
        assert review.suggested_next_actions_json[0]["title"] == "Keep it up"

@pytest.mark.asyncio
async def test_generate_weekly_review_no_evidence(monkeypatch: pytest.MonkeyPatch):
    async with AsyncSessionLocal() as session:
        profile = await upsert_profile(
            session,
            USER_ID,
            WORKSPACE_ID,
            CareerProfileUpsert(headline="Weekly Review No Evidence Profile"),
        )
        # Cleanup
        await session.execute(delete(WeeklyReviewRun).where(WeeklyReviewRun.profile_id == profile.id))
        await session.execute(delete(PerformanceProgressEntry))
        await session.execute(delete(PerformanceContextItem).where(PerformanceContextItem.profile_id == profile.id))
        await session.execute(delete(Achievement).where(Achievement.profile_id == profile.id))
        await session.execute(delete(InterviewStory).where(InterviewStory.user_id == USER_ID))
        await session.commit()

        week_start = date.today() - timedelta(days=7)
        week_end = date.today()

        # Mock refresh_assessment
        async def fake_refresh_assessment(db, u_id, w_id):
            return None
        
        monkeypatch.setattr(coach_service, "refresh_assessment_sync", fake_refresh_assessment)

        review = await weekly_review_service.generate_weekly_review(
            session, USER_ID, WORKSPACE_ID, week_start, week_end
        )

        assert review.manager_report_markdown == "No new evidence recorded this week."
        assert len(review.new_evidence_json) == 0
        assert review.assessment_snapshot_id is None
