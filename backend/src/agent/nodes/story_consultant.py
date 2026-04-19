"""Story consultant and autopilot nodes."""

from __future__ import annotations

import json
import logging
from typing import Any

from src.agent.state import CareerAgentState
from src.prompts.story_consultant import (
    AUTOPILOT_SYSTEM_PROMPT,
    CONSULTANT_SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)


async def _get_achievements_context(user_id: str, workspace_id: str, resume_id: str | None = None) -> str:
    """Fetch and format user achievements and profile for LLM context.
    If resume_id is provided, filters context to only what is present in that resume version.
    """
    from uuid import UUID
    from sqlalchemy import select
    from src.core.database import AsyncSessionLocal
    from src.services.achievement_service import list_achievements
    from src.services.profile_service import get_profile
    from src.services.project_service import list_by_profile
    from src.services.work_experience_service import list_by_profile as list_we_by_profile
    from src.services.education_service import list_by_profile as list_edu_by_profile
    from src.models.resume import Resume, ResumeVersion

    async with AsyncSessionLocal() as session:
        profile = await get_profile(session, UUID(user_id), UUID(workspace_id))
        if not profile:
            return "No profile found for this user."
        
        profile_id = profile.id
        achievements = await list_achievements(session, UUID(user_id))
        projects = await list_by_profile(session, profile_id)
        work_exps = await list_we_by_profile(session, profile_id)
        educations = await list_edu_by_profile(session, profile_id)

        resume_content = None
        if resume_id:
            # Get the latest version of this resume
            stmt = (
                select(ResumeVersion)
                .where(ResumeVersion.resume_id == UUID(resume_id))
                .order_by(ResumeVersion.version_no.desc())
                .limit(1)
            )
            res = await session.execute(stmt)
            version = res.scalar_one_or_none()
            if version:
                resume_content = version.content_json

    # Build lookup maps
    project_map = {p.id: p.name for p in projects}
    we_map = {w.id: f"{w.company_name} - {w.role_title}" for w in work_exps}
    edu_map = {e.id: e.institution_name for e in educations}

    # Filtering logic for resume-specific context
    allowed_project_ids = set()
    allowed_we_ids = set()
    allowed_edu_ids = set()
    is_resume_mode = False

    if resume_content:
        is_resume_mode = True
        # Extract IDs from resume content
        for exp in resume_content.get("experiences", []):
            if "id" in exp:
                try:
                    allowed_we_ids.add(UUID(exp["id"]))
                except (ValueError, TypeError):
                    pass
        for proj in resume_content.get("projects", []):
            if "id" in proj:
                try:
                    allowed_project_ids.add(UUID(proj["id"]))
                except (ValueError, TypeError):
                    pass
        # Highlights are usually free text, but we can look for achievement associations if they existed.
        # For now, we mainly filter by entity IDs.

    context = []
    if is_resume_mode:
        context.append("--- [RESUME-CONSISTENCY SANDBOX MODE ACTIVE] ---")
        context.append("The following data is strictly limited to what is currently present in the candidate's selected resume.")
    
    context.append(f"Candidate Profile Summary: {profile.professional_summary or 'N/A'}")
    if profile.skill_categories:
        context.append(f"Key Skills: {json.dumps(profile.skill_categories)}")

    if not achievements:
        context.append("No specific achievements found in the bank.")
        return "\n\n".join(context)

    # Group achievements
    grouped = {}  # (type, id, name) -> [achievements]
    others = []

    for a in achievements:
        # If in resume mode, skip achievements not linked to allowed entities
        if is_resume_mode:
            is_allowed = False
            if a.project_id and a.project_id in allowed_project_ids:
                is_allowed = True
            elif a.work_experience_id and a.work_experience_id in allowed_we_ids:
                is_allowed = True
            # Education might not be filtered if we don't have IDs in resume content yet
            
            if not is_allowed:
                continue

        key = None
        if a.project_id and a.project_id in project_map:
            key = ("Project", a.project_id, project_map[a.project_id])
        elif a.work_experience_id and a.work_experience_id in we_map:
            key = ("Experience", a.work_experience_id, we_map[a.work_experience_id])
        elif a.education_id and a.education_id in edu_map:
            key = ("Education", a.education_id, edu_map[a.education_id])
        
        if key:
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(a)
        else:
            if not is_resume_mode:
                others.append(a)

    context.append("Detailed Achievements (Grouped by Context):")
    
    def format_achievement(a):
        pd = a.parsed_data or {}
        metrics = pd.get("metrics", [])
        tech = pd.get("technical_points", [])
        return (
            f"- {a.title} (ID: {a.id})\n"
            f"  Summary: {pd.get('summary', '')}\n"
            f"  Metrics: {', '.join(str(m) for m in metrics)}\n"
            f"  Tech: {', '.join(str(t) for t in tech)}"
        )

    for (ctype, cid, name), achs in grouped.items():
        context.append(f"### [{ctype}] {name}")
        for a in achs:
            context.append(format_achievement(a))

    if others:
        context.append("### [Other Achievements]")
        for a in others:
            context.append(format_achievement(a))

    return "\n\n".join(context)


async def story_consultant(state: CareerAgentState) -> dict:
    """Analyze a story draft and provide interactive feedback in JSON format."""
    user_id = state.get("user_id")
    workspace_id = state.get("workspace_id")
    resume_id = state.get("resume_id")
    question_text = state.get("question_text", "Untitled Question")
    answer_markdown = state.get("answer_markdown", "")
    user_message = state.get("user_message", "")

    if not user_id or not workspace_id:
        return {"pipeline_error": "user_id or workspace_id missing in state"}

    achievements_context = await _get_achievements_context(user_id, workspace_id, resume_id)

    system_prompt_prefix = ""
    if resume_id:
        system_prompt_prefix = "\n\n警告：你现在处于【简历一致性沙盒】模式。你只能使用用户当前简历中提供的信息。严禁引用简历之外的项目或成就。\n\n"

    prompt = system_prompt_prefix + CONSULTANT_SYSTEM_PROMPT.format(
        question_text=question_text,
        answer_markdown=answer_markdown,
        achievements_context=achievements_context,
    )

    try:
        from src.core.llm import get_llm

        llm = get_llm("story_consultant")
        response = await llm.ainvoke([{"role": "user", "content": prompt}])
        content = response.content
        
        # Clean potential markdown wrapping around JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        
        result = json.loads(content.strip())
        feedback = result.get("content", "No feedback generated.")
        suggestion_summary = result.get("suggestion_summary")
        suggested_text = result.get("suggested_text")
        linked_achievement_ids = result.get("linked_achievement_ids", [])
    except Exception as e:
        logger.error(f"Story consultant LLM call failed or JSON parsing failed: {e}")
        feedback = "I'm sorry, I encountered an error. Please try again."
        suggestion_summary = None
        suggested_text = None
        linked_achievement_ids = []

    return {
        "consultant_feedback": feedback,
        "suggestion_summary": suggestion_summary,
        "suggested_text": suggested_text,
        "linked_achievement_ids": linked_achievement_ids,
        "agent_logs": state.get("agent_logs", []) + [
            {"node": "story_consultant", "action": "generated_feedback_json"}
        ],
    }


async def story_autopilot(state: CareerAgentState) -> dict:
    """Generate a full STAR story draft from achievements."""
    user_id = state.get("user_id")
    workspace_id = state.get("workspace_id")
    resume_id = state.get("resume_id")
    question_text = state.get("question_text", "Untitled Question")

    if not user_id or not workspace_id:
        return {"pipeline_error": "user_id or workspace_id missing in state"}

    achievements_context = await _get_achievements_context(user_id, workspace_id, resume_id)

    system_prompt_prefix = ""
    if resume_id:
        system_prompt_prefix = "\n\n警告：你现在处于【简历一致性沙盒】模式。你只能使用用户当前简历中提供的信息。严禁引用简历之外的项目或成就。\n\n"

    prompt = system_prompt_prefix + AUTOPILOT_SYSTEM_PROMPT.format(
        question_text=question_text,
        achievements_context=achievements_context,
    )

    result = {}
    try:
        from src.core.llm import get_llm

        llm = get_llm("story_autopilot")
        response = await llm.ainvoke([{"role": "user", "content": prompt}])
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        result = json.loads(content.strip())
    except Exception as e:
        logger.error(f"Story autopilot LLM call failed: {e}")
        return {"pipeline_error": f"Autopilot failed: {str(e)}"}

    return {
        "autopilot_result": result,
        "agent_logs": state.get("agent_logs", []) + [
            {"node": "story_autopilot", "action": "generated_draft"}
        ],
    }
