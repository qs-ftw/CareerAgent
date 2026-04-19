"""Database-backed service for interview story operations."""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.story import InterviewStory, ResumeInterviewAnswer
from src.schemas.story import StoryCreate, StoryResponse, StoryUpdate

logger = logging.getLogger(__name__)


async def _get_or_create_resume_answer(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    story_id: uuid.UUID,
    resume_id: uuid.UUID,
) -> ResumeInterviewAnswer:
    stmt = select(ResumeInterviewAnswer).where(
        ResumeInterviewAnswer.story_id == story_id,
        ResumeInterviewAnswer.resume_id == resume_id,
        ResumeInterviewAnswer.user_id == user_id,
    )
    result = await session.execute(stmt)
    answer = result.scalar_one_or_none()
    
    if not answer:
        answer = ResumeInterviewAnswer(
            workspace_id=workspace_id,
            user_id=user_id,
            story_id=story_id,
            resume_id=resume_id,
            status="empty",
        )
        session.add(answer)
        await session.flush()
    
    return answer


DEFAULT_QUESTIONS = [
    {"question_text": "请做一下自我介绍。", "theme": "general"},
    {"question_text": "你最大的优点是什么？", "theme": "general"},
    {"question_text": "你最大的缺点是什么？", "theme": "general"},
    {"question_text": "为什么你想加入我们公司？", "theme": "general"},
    {"question_text": "为什么我们应该录用你？", "theme": "general"},
    {"question_text": "描述一个你在工作中遇到的困难挑战，以及你是如何克服它的。", "theme": "problem_solving"},
    {"question_text": "请举例说明你的领导力。 ", "theme": "leadership"},
    {"question_text": "讲一个你失败的经历。", "theme": "problem_solving"},
    {"question_text": "你如何处理压力和焦虑？", "theme": "general"},
    {"question_text": "描述一次你与同事发生冲突的经历及解决方法。", "theme": "collaboration"},
    {"question_text": "你的长期职业目标是什么？", "theme": "general"},
    {"question_text": "你目前取得的最大职业成就是什么？", "theme": "technical"},
    {
        "question_text": "讲一段你必须快速学习某项新技能的经历。",
        "theme": "technical",
    },
    {"question_text": "你如何安排工作的优先级？", "theme": "general"},
    {"question_text": "描述你理想的工作环境。", "theme": "general"},
    {
        "question_text": "讲一次你超越职责范围为项目做出贡献的经历。",
        "theme": "leadership",
    },
    {
        "question_text": "当你不同意工作中的某项决定时，你会怎么做？",
        "theme": "collaboration",
    },
    {"question_text": "你如何处理他人的反馈？", "theme": "general"},
    {"question_text": "你对自己未来五年的规划是怎样的？", "theme": "general"},
    {"question_text": "你有什么问题想问我们吗？", "theme": "general"},
]

async def seed_default_stories(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
) -> list[InterviewStory]:
    """Seed the interview story bank with default questions."""
    stories = []
    for q in DEFAULT_QUESTIONS:
        story = InterviewStory(
            user_id=user_id,
            workspace_id=workspace_id,
            question_text=q["question_text"],
            theme=q["theme"],
            status="empty",
        )
        session.add(story)
        stories.append(story)
    await session.flush()
    return stories


def _to_response(story: InterviewStory | ResumeInterviewAnswer, base_story: InterviewStory | None = None) -> StoryResponse:
    # Use fields from base_story (the question bank) if available
    question_text = base_story.question_text if base_story else getattr(story, "question_text", "")
    theme = base_story.theme if base_story else getattr(story, "theme", "general")
    
    linked_ids = []
    ids_source = getattr(story, "linked_achievement_ids", []) or []
    for id_val in ids_source:
        try:
            if isinstance(id_val, str):
                linked_ids.append(uuid.UUID(id_val))
            else:
                linked_ids.append(id_val)
        except (ValueError, TypeError):
            logger.warning(f"Invalid UUID in linked_achievement_ids: {id_val}")
            continue

    return StoryResponse(
        id=story.id if not base_story else base_story.id,
        question_text=question_text,
        answer_markdown=getattr(story, "answer_markdown", ""),
        theme=theme,
        status=getattr(story, "status", "empty"),
        linked_achievement_ids=linked_ids,
        analysis_chat=getattr(story, "analysis_chat", []) or [],
        star_summary=getattr(story, "star_summary", {}) or {},
        confidence_score=getattr(story, "confidence_score", 0.0),
        created_at=story.created_at,
        updated_at=story.updated_at,
    )


async def list_stories(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID | None = None,
    theme: str | None = None,
    resume_id: uuid.UUID | None = None,
) -> list[StoryResponse]:
    if resume_id:
        # 仅返回该简历关联的已作答问题
        stmt = (
            select(ResumeInterviewAnswer, InterviewStory)
            .join(InterviewStory, ResumeInterviewAnswer.story_id == InterviewStory.id)
            .where(
                ResumeInterviewAnswer.resume_id == resume_id,
                ResumeInterviewAnswer.user_id == user_id,
                InterviewStory.deleted_at.is_(None)
            )
        )
        result = await session.execute(stmt)
        # SQLAlchemy returns a list of result rows which behave like tuples
        rows = result.all()
        return [_to_response(row[0], row[1]) for row in rows]

    # 全局视图逻辑保持不变
    stmt = (
        select(InterviewStory)
        .where(InterviewStory.user_id == user_id, InterviewStory.deleted_at.is_(None))
        .order_by(InterviewStory.confidence_score.desc(), InterviewStory.created_at.desc())
    )
    if theme is not None:
        stmt = stmt.where(InterviewStory.theme == theme)

    result = await session.execute(stmt)
    stories = result.scalars().all()

    if not stories and workspace_id:
        stories = await seed_default_stories(session, user_id, workspace_id)

    return [_to_response(s) for s in stories]


async def get_story(
    session: AsyncSession,
    user_id: uuid.UUID,
    story_id: uuid.UUID,
    resume_id: uuid.UUID | None = None,
) -> StoryResponse | None:
    # 获取基础问题信息
    stmt = select(InterviewStory).where(
        InterviewStory.id == story_id,
        InterviewStory.user_id == user_id,
        InterviewStory.deleted_at.is_(None),
    )
    res = await session.execute(stmt)
    story = res.scalar_one_or_none()
    if not story:
        return None

    if resume_id:
        # 获取或创建该简历的回答版本
        # 注意：这里我们只查询。如果不存在，返回一个空白结果，不自动插入数据库（除非用户开始编辑）
        stmt_ans = select(ResumeInterviewAnswer).where(
            ResumeInterviewAnswer.story_id == story_id,
            ResumeInterviewAnswer.resume_id == resume_id,
            ResumeInterviewAnswer.user_id == user_id,
        )
        res_ans = await session.execute(stmt_ans)
        answer = res_ans.scalar_one_or_none()
        if answer:
            return _to_response(answer, story)
        else:
            # 返回一个伪造的空白响应对象，模拟初始状态
            return StoryResponse(
                id=story.id,
                question_text=story.question_text,
                answer_markdown="",
                theme=story.theme,
                status="empty",
                linked_achievement_ids=[],
                analysis_chat=[],
                star_summary={},
                confidence_score=0.0,
                created_at=story.created_at,
                updated_at=story.updated_at,
            )

    return _to_response(story)


async def update_story(
    session: AsyncSession,
    user_id: uuid.UUID,
    story_id: uuid.UUID,
    data: StoryUpdate,
) -> StoryResponse | None:
    # 获取基础问题
    stmt = select(InterviewStory).where(
        InterviewStory.id == story_id,
        InterviewStory.user_id == user_id,
        InterviewStory.deleted_at.is_(None),
    )
    res = await session.execute(stmt)
    story = res.scalar_one_or_none()
    if story is None:
        return None

    target_obj = story
    resume_id = getattr(data, "resume_id", None)
    
    if resume_id:
        # 使用辅助函数获取或创建针对简历的记录
        target_obj = await _get_or_create_resume_answer(
            session, user_id, story.workspace_id, story_id, resume_id
        )

    update_map = data.model_dump(exclude_unset=True)
    # 过滤掉 resume_id 本身，因为它不是模型字段
    update_map.pop("resume_id", None)

    for key, value in update_map.items():
        if hasattr(target_obj, key):
            if key == "linked_achievement_ids":
                setattr(target_obj, key, [str(uid) for uid in value])
            else:
                setattr(target_obj, key, value)

    await session.flush()
    await session.refresh(target_obj)
    if resume_id and story:
        await session.refresh(story)
        
    return _to_response(target_obj, story if resume_id else None)


async def batch_import_stories(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    questions: list[str],
) -> list[StoryResponse]:
    """Batch import multiple questions as empty stories."""
    created = []
    for q_text in questions:
        story = InterviewStory(
            workspace_id=workspace_id,
            user_id=user_id,
            question_text=q_text,
            theme="general",
            status="empty",
        )
        session.add(story)
        created.append(story)
    await session.flush()
    return [_to_response(s) for s in created]


async def rebuild_from_achievement(
    session: AsyncSession,
    user_id: uuid.UUID,
    workspace_id: uuid.UUID,
    achievement_id: uuid.UUID,
) -> list[StoryResponse]:
    """Extract stories from an achievement and persist them.
    Updated to use answer_markdown and star_summary.
    """
    from src.models.achievement import Achievement

    # Load the achievement
    stmt = select(Achievement).where(Achievement.id == achievement_id)
    result = await session.execute(stmt)
    achievement = result.scalar_one_or_none()
    if achievement is None:
        return []

    # Build parsed data for story extraction
    achievement_parsed = {
        "title": achievement.title,
        "summary": achievement.parsed_summary or "",
        "technical_points": achievement.technical_points_json or [],
        "challenges": achievement.challenges_json or [],
        "solutions": achievement.solutions_json or [],
        "metrics": achievement.metrics_json or [],
        "interview_points": achievement.interview_points_json or [],
        "tags": achievement.tags_json or [],
    }

    # Invoke story extraction node
    try:
        from src.agent.nodes.story_extraction import story_extraction
        state = {
            "achievement_parsed": achievement_parsed,
            "achievement_id": str(achievement_id),
            "agent_logs": [],
        }
        result_state = await story_extraction(state)
        candidates = result_state.get("story_candidates", [])
    except Exception as e:
        logger.error(f"Story extraction failed for achievement {achievement_id}: {e}")
        # Fallback: create a basic story
        candidates = []
        if achievement_parsed.get("interview_points"):
            candidates.append({
                "question_text": f"Tell me about your experience with: {achievement.title}",
                "theme": "general",
                "star_summary": {
                    "situation": achievement_parsed.get("summary", ""),
                    "task": "",
                    "action": ", ".join(str(p) for p in achievement_parsed.get("technical_points", [])[:3]),
                    "result": ", ".join(str(m) for m in achievement_parsed.get("metrics", [])[:3]),
                },
                "confidence_score": 0.5,
            })

    # Persist stories
    created = []
    for candidate in candidates:
        story = InterviewStory(
            workspace_id=workspace_id,
            user_id=user_id,
            question_text=candidate.get("question_text") or candidate.get("title") or "Untitled Question",
            theme=candidate.get("theme", "general"),
            status="draft",
            linked_achievement_ids=[str(achievement_id)],
            star_summary=candidate.get("star_summary") or candidate.get("story_json") or {},
            confidence_score=candidate.get("confidence_score", 0.0),
        )
        session.add(story)
        await session.flush()
        await session.refresh(story)
        created.append(_to_response(story))

    return created


async def consult_story(
    session: AsyncSession,
    user_id: uuid.UUID,
    story_id: uuid.UUID,
    user_message: str | None = None,
    resume_id: uuid.UUID | None = None,
) -> str:
    """Invoke the AI consultant to provide feedback on a story."""
    stmt = select(InterviewStory).where(
        InterviewStory.id == story_id,
        InterviewStory.user_id == user_id,
        InterviewStory.deleted_at.is_(None),
    )
    result = await session.execute(stmt)
    story = result.scalar_one_or_none()
    if story is None:
        return "Story not found."

    resume_answer = None
    if resume_id:
        resume_answer = await _get_or_create_resume_answer(
            session, user_id, story.workspace_id, story_id, resume_id
        )

    from src.agent.nodes.story_consultant import story_consultant

    state = {
        "user_id": str(user_id),
        "workspace_id": str(story.workspace_id),
        "resume_id": str(resume_id) if resume_id else None,
        "question_text": story.question_text,
        "answer_markdown": (resume_answer.answer_markdown if resume_answer else story.answer_markdown) or "",
        "user_message": user_message,
        "agent_logs": [],
    }

    try:
        result_state = await story_consultant(state)
        feedback = result_state.get("consultant_feedback", "No feedback generated.")
        suggestion_summary = result_state.get("suggestion_summary")
        suggested_text = result_state.get("suggested_text")
        linked_achievement_ids = result_state.get("linked_achievement_ids", [])
    except Exception as e:
        logger.error(f"story_consultant failed: {e}")
        return "Sorry, I encountered an error while consulting. Please try again."

    # Update chat history with structured data
    target_obj = resume_answer if resume_answer else story
    chat = list(target_obj.analysis_chat or [])
    if user_message:
        chat.append({"role": "user", "content": user_message})
    
    assistant_msg = {
        "role": "assistant", 
        "content": feedback,
    }
    if suggestion_summary:
        assistant_msg["suggestion_summary"] = suggestion_summary
    if suggested_text:
        assistant_msg["suggested_text"] = suggested_text
    if linked_achievement_ids:
        # Optionally resolve names here, or just store IDs
        assistant_msg["linked_achievement_ids"] = linked_achievement_ids
        
    chat.append(assistant_msg)
    target_obj.analysis_chat = chat

    await session.flush()
    return feedback


async def autopilot_story(
    session: AsyncSession,
    user_id: uuid.UUID,
    story_id: uuid.UUID,
    resume_id: uuid.UUID | None = None,
) -> StoryResponse | None:
    """Use AI to generate a complete draft for a story."""
    logger.info(f"Autopilot requested for story_id={story_id}, user_id={user_id}, resume_id={resume_id}")
    stmt = select(InterviewStory).where(
        InterviewStory.id == story_id,
        InterviewStory.user_id == user_id,
        InterviewStory.deleted_at.is_(None),
    )
    result = await session.execute(stmt)
    story = result.scalar_one_or_none()
    if story is None:
        logger.warning(f"Story NOT FOUND: id={story_id}, user_id={user_id}")
        return None

    resume_answer = None
    if resume_id:
        resume_answer = await _get_or_create_resume_answer(
            session, user_id, story.workspace_id, story_id, resume_id
        )

    from src.agent.nodes.story_consultant import story_autopilot

    state = {
        "user_id": str(user_id),
        "workspace_id": str(story.workspace_id),
        "resume_id": str(resume_id) if resume_id else None,
        "question_text": story.question_text,
        "agent_logs": [],
    }

    try:
        result_state = await story_autopilot(state)
        autopilot_result = result_state.get("autopilot_result", {})
    except Exception as e:
        logger.error(f"story_autopilot failed: {e}")
        return _to_response(story)

    if autopilot_result:
        target_obj = resume_answer if resume_answer else story
        
        target_obj.answer_markdown = autopilot_result.get("answer_markdown")
        if hasattr(target_obj, "star_summary"):
            target_obj.star_summary = autopilot_result.get("star_summary") or {}
        
        if not resume_answer:
            target_obj.theme = autopilot_result.get("theme", target_obj.theme)
            target_obj.confidence_score = autopilot_result.get("confidence_score", target_obj.confidence_score)
        
        target_obj.status = "draft"
        if autopilot_result.get("linked_achievement_ids"):
            target_obj.linked_achievement_ids = [
                str(uid) for uid in autopilot_result["linked_achievement_ids"]
            ]

        await session.flush()
        await session.refresh(target_obj)
        if resume_id and story:
            await session.refresh(story)

    target_obj = resume_answer if resume_answer else story
    return _to_response(target_obj, story if resume_id else None)
