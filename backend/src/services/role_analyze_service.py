"""Service for JD/name analysis preview — no side effects."""

from __future__ import annotations

import json
import logging

logger = logging.getLogger(__name__)

_JD_ANALYZE_PROMPT = """\
You are an expert job description parser for software engineering roles.

Given the raw job description text, extract AND EXPAND structured information as JSON:
{
  "role_name": "Position title",
  "description": "A well-structured 200-500 character description of the role. Expand abstract requirements into concrete ones. E.g. instead of 'familiar with frontend frameworks', write 'proficient in React or Vue, including state management (Redux/Pinia), component design patterns, and performance optimization'. Instead of 'big data experience', write 'hands-on experience with Hadoop/Spark/Flink for large-scale data processing'. Be specific, concrete, and well-organized.",
  "required_skills": ["list of SPECIFIC, concrete required skills. E.g. instead of 'frontend development', list ['React', 'TypeScript', 'CSS-in-JS']. Instead of 'backend', list ['Python', 'FastAPI', 'PostgreSQL']. Each skill should be a distinct technology or tool."],
  "bonus_skills": ["list of nice-to-have skills, also specific and concrete"],
  "keywords": ["important keywords and phrases from the JD"]
}

Rules:
- required_skills and bonus_skills must be CONCRETE technologies, frameworks, or tools — not abstract categories
- description must EXPAND vague JD language into specific, concrete requirements
- Include both explicit and implicit requirements
- Return ONLY the JSON object, no other text
"""

_NAME_ANALYZE_PROMPT = """\
You are an expert career advisor who understands the software industry deeply.

Given a job title, generate a comprehensive analysis of what this role typically requires. Return JSON:
{
  "role_name": "The exact job title provided",
  "description": "A well-structured 200-500 character description of typical responsibilities, requirements, and expectations for this role. Be specific about technologies, methodologies, and skills commonly required.",
  "required_skills": ["list of 8-12 SPECIFIC, concrete skills typically required. Each should be a distinct technology, framework, or tool (e.g. 'React', 'TypeScript', 'System Design')."],
  "bonus_skills": ["list of 4-6 nice-to-have skills that make candidates stand out"],
  "keywords": ["8-12 important keywords and phrases commonly associated with this role"]
}

Rules:
- Skills must be CONCRETE technologies, frameworks, or tools — not abstract categories
- Description should reflect industry-standard expectations for this role level
- Consider the current technology landscape (2025-2026)
- Return ONLY the JSON object, no other text
"""


def _extract_json(text: str) -> dict:
    """Extract JSON from LLM response that may be wrapped in ```json```."""
    content = text
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    return json.loads(content.strip())


async def analyze_jd(raw_jd: str) -> dict:
    """Analyze a JD text and return structured preview data. No DB writes."""
    try:
        from src.core.llm import get_llm

        llm = get_llm("jd_parsing")
        response = await llm.ainvoke(
            [
                {"role": "system", "content": _JD_ANALYZE_PROMPT},
                {"role": "user", "content": f"Parse this job description:\n\n{raw_jd}"},
            ]
        )
        parsed = _extract_json(response.content)
    except Exception as e:
        logger.warning(f"LLM JD analysis failed ({e}), returning minimal result")
        parsed = {
            "role_name": "Unknown Role",
            "description": raw_jd[:500] if len(raw_jd) > 500 else raw_jd,
            "required_skills": [],
            "bonus_skills": [],
            "keywords": [],
        }

    return {
        "role_name": parsed.get("role_name", ""),
        "role_type": "全职",
        "description": parsed.get("description", ""),
        "required_skills": parsed.get("required_skills", []),
        "bonus_skills": parsed.get("bonus_skills", []),
        "keywords": parsed.get("keywords", []),
    }


async def analyze_name(role_name: str) -> dict:
    """Analyze a role name and return typical JD data. No DB writes."""
    try:
        from src.core.llm import get_llm

        llm = get_llm("jd_parsing")
        response = await llm.ainvoke(
            [
                {"role": "system", "content": _NAME_ANALYZE_PROMPT},
                {"role": "user", "content": f"Generate a typical job profile for: {role_name}"},
            ]
        )
        parsed = _extract_json(response.content)
    except Exception as e:
        logger.warning(f"LLM name analysis failed ({e}), returning minimal result")
        parsed = {
            "role_name": role_name,
            "description": "",
            "required_skills": [],
            "bonus_skills": [],
            "keywords": [],
        }

    return {
        "role_name": parsed.get("role_name", role_name),
        "role_type": "全职",
        "description": parsed.get("description", ""),
        "required_skills": parsed.get("required_skills", []),
        "bonus_skills": parsed.get("bonus_skills", []),
        "keywords": parsed.get("keywords", []),
    }
