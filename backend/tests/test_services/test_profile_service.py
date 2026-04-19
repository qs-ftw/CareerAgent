"""Tests for profile service — create, get, update, and completeness."""

from __future__ import annotations

import uuid

import pytest

from src.core.database import AsyncSessionLocal
from src.schemas.profile import CareerProfileUpsert
from src.services import profile_service

# Use the MVP user/workspace that exists in the database
USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
WORKSPACE_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


@pytest.mark.asyncio
async def test_upsert_creates_new_profile():
    async with AsyncSessionLocal() as session:
        payload = CareerProfileUpsert(
            name="Qiuwu",
            headline="Agent engineer focused on long-term automation",
            professional_summary="Built multiple AI workflows and production services.",
            skill_categories={
                "Platforms": ["LangGraph orchestration"],
                "Strengths": ["Backend systems"],
            },
        )
        profile = await profile_service.upsert_profile(
            session, USER_ID, WORKSPACE_ID, payload
        )
        await session.commit()
        assert profile.name == "Qiuwu"
        assert profile.headline.startswith("Agent engineer")
        assert profile.skill_categories["Platforms"] == ["LangGraph orchestration"]
        assert profile.professional_summary.startswith("Built multiple AI workflows")


@pytest.mark.asyncio
async def test_upsert_updates_existing_profile():
    async with AsyncSessionLocal() as session:
        payload1 = CareerProfileUpsert(headline="First headline")
        await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload1)
        await session.commit()

        payload2 = CareerProfileUpsert(
            headline="Updated headline",
            skill_categories={"Languages": ["Python"]},
        )
        profile = await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload2)
        await session.commit()
        assert profile.headline == "Updated headline"
        assert profile.skill_categories == {"Languages": ["Python"]}


@pytest.mark.asyncio
async def test_get_profile_returns_created_profile():
    async with AsyncSessionLocal() as session:
        payload = CareerProfileUpsert(headline="Test headline svc")
        await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload)
        await session.commit()

        result = await profile_service.get_profile(session, USER_ID, WORKSPACE_ID)
        assert result is not None
        assert result.headline == "Test headline svc"


@pytest.mark.asyncio
async def test_completeness_with_partial_profile():
    async with AsyncSessionLocal() as session:
        payload = CareerProfileUpsert(
            headline="Has headline",
            skill_categories={"Languages": ["Python"]},
        )
        await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload)
        await session.commit()
        completeness = await profile_service.get_completeness(session, USER_ID, WORKSPACE_ID)
        assert completeness.filled_fields >= 2
        assert 0 < completeness.completeness_pct <= 100


@pytest.mark.asyncio
async def test_skill_categories_roundtrip_as_structured_json():
    async with AsyncSessionLocal() as session:
        skill_categories = {
            "Projects": ["CareerAgent", "DataPipeline"],
            "Impact": ["multi-role resume orchestration", "10x throughput improvement"],
        }
        payload = CareerProfileUpsert(
            headline="Proof point test",
            skill_categories=skill_categories,
        )
        profile = await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload)
        await session.commit()
        assert len(profile.skill_categories["Projects"]) == 2
        assert profile.skill_categories["Projects"][1] == "DataPipeline"

        # Verify roundtrip via get
        fetched = await profile_service.get_profile(session, USER_ID, WORKSPACE_ID)
        assert fetched is not None
        assert fetched.skill_categories == skill_categories


@pytest.mark.asyncio
async def test_one_user_gets_one_canonical_profile():
    async with AsyncSessionLocal() as session:
        payload1 = CareerProfileUpsert(headline="Canonical first")
        await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload1)
        await session.commit()

        payload2 = CareerProfileUpsert(headline="Canonical second")
        profile = await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload2)
        await session.commit()

        # Should still be the same profile (updated, not duplicated)
        assert profile.headline == "Canonical second"

        result = await profile_service.get_profile(session, USER_ID, WORKSPACE_ID)
        assert result is not None
        assert result.headline == "Canonical second"


@pytest.mark.asyncio
async def test_get_profile_context_returns_dict():
    async with AsyncSessionLocal() as session:
        payload = CareerProfileUpsert(
            headline="Context test",
            skill_categories={"Languages": ["Go", "Python"]},
        )
        await profile_service.upsert_profile(session, USER_ID, WORKSPACE_ID, payload)
        await session.commit()

        ctx = await profile_service.get_profile_context(session, USER_ID, WORKSPACE_ID)
        assert ctx["headline"] == "Context test"
        assert ctx["skill_categories"] == {"Languages": ["Go", "Python"]}
