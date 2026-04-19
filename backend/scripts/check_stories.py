import asyncio
import uuid
from sqlalchemy import select
from src.core.database import AsyncSessionLocal
from src.models.story import InterviewStory

async def check_stories():
    async with AsyncSessionLocal() as session:
        stmt = select(InterviewStory)
        result = await session.execute(stmt)
        stories = result.scalars().all()
        print(f"Total stories: {len(stories)}")
        for s in stories:
            # Check if English
            is_english = all(ord(c) < 128 for c in s.question_text)
            if is_english:
                print(f"EN: [{s.theme}] {s.question_text}")
            else:
                print(f"CN: [{s.theme}] {s.question_text}")

if __name__ == "__main__":
    asyncio.run(check_stories())
