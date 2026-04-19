"""Shared pytest fixtures for the CareerAgent backend test suite."""

from __future__ import annotations

import asyncio
import os

import pytest
import pytest_asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.core import config as config_module
from src.core import database as db_module
from src.models.base import Base

# Import all models to register them with Base metadata
import src.models  # noqa: F401

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5433/careeragent_test",
)


def _patch_database(test_engine):
    """Override the global database engine and session factory to use the test DB."""
    config_module.settings.DATABASE_URL = TEST_DATABASE_URL
    db_module.async_engine = test_engine
    db_module.AsyncSessionLocal = async_sessionmaker(
        bind=test_engine,
        class_=db_module.AsyncSession,
        expire_on_commit=False,
    )


@pytest.fixture(scope="session", autouse=True)
def _event_loop() -> asyncio.AbstractEventLoop:
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def _test_engine():
    """Create the async engine bound to the test database."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        pool_size=5,
        max_overflow=5,
        pool_pre_ping=True,
    )
    _patch_database(engine)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function", autouse=True)
async def _clean_db(_test_engine):
    """Truncate all tables before each test to ensure isolation."""
    async with _test_engine.begin() as conn:
        # Disable triggers to avoid FK constraint issues during truncate
        tables_result = await conn.execute(
            text(
                """
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public' AND tablename != 'alembic_version'
                """
            )
        )
        tables = [row[0] for row in tables_result.fetchall()]
        if tables:
            for table in tables:
                await conn.execute(
                    text(f'ALTER TABLE "{table}" DISABLE TRIGGER ALL')
                )
            for table in tables:
                await conn.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))
            for table in tables:
                await conn.execute(
                    text(f'ALTER TABLE "{table}" ENABLE TRIGGER ALL')
                )
    yield
