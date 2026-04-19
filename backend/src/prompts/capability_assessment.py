"""Prompt builder for performance coach capability assessment."""

from __future__ import annotations

import json

CAPABILITY_RUBRIC: dict = {
    "core_levels": {
        "未证明": "证据不足，无法稳定判断能力层级。",
        "C1": "可稳定完成明确边界内的任务，结果可交付。",
        "C2": "可独立负责小模块或子问题闭环，并持续优化。",
        "C3": "可跨模块推动复杂问题解决，并沉淀可复用资产。",
        "C4": "可定义方向、带动他人并建立系统性影响。",
    },
    "dimensions": {
        "execution_delivery": "执行交付与结果稳定性",
        "breakthrough_problem_solving": "突破性问题解决",
        "core_backbone": "核心骨干与 owner 能力",
        "collaboration_influence": "协作与影响力",
        "exploration_innovation": "探索与创新",
    },
    "hard_rules": [
        "只根据 evidence_pack 中的证据输出结论，不能编造经历。",
        "profile、work_experiences 和 projects 仅作为上下文，不单独构成已证明能力；正式证明优先来自 achievements 和 stories。",
        "如果证据不足，必须返回 未证明 或更低的保守判断。",
        "dimension_levels 只允许使用固定维度键。",
        "evidence_links 必须可追溯到具体证据项。",
        "suggested_actions 应该是可执行、可验证的下一步动作。",
        "输出必须是严格 JSON，禁止 Markdown、前后说明或代码块。",
    ],
    "json_structure_example": {
        "core_level": "C2",
        "core_reasoning_markdown": "简要说明理由...",
        "dimension_levels": {
            "execution_delivery": {
                "level": "C2",
                "status": "proven",
                "summary": "表现说明...",
                "evidence_count": 2
            }
        },
        "evidence_links": [
            {
                "source_type": "achievement",
                "source_id": "UUID_HERE",
                "title": "成就标题",
                "summary": "证明了什么...",
                "dimensions": ["execution_delivery"]
            }
        ],
        "next_level_gaps": ["差距1"],
        "suggested_actions": ["动作1"]
    }
}

SYSTEM_PROMPT = """\
You are a performance coach capability assessor.

Read the evidence pack and produce a strict JSON object with exactly these keys:
core_level, core_reasoning_markdown, dimension_levels, evidence_links,
next_level_gaps, suggested_actions

Rules:
- Use the rubric and hard rules below.
- Follow the structure in <rubric>.json_structure_example EXACTLY.
- dimension_levels values must be OBJECTS (containing level, status, summary, evidence_count), NOT strings.
- evidence_links items must be OBJECTS (containing source_type, source_id, title, summary, dimensions), NOT strings.
- Be conservative: do not overstate capability without evidence.
- Keep reasoning grounded in the provided evidence pack.
- Treat profile, performance_context, work_experiences, and projects as background context unless they are supported by achievements or stories.
- Return JSON only, no prose, no markdown fences.
"""


def render_capability_assessment_prompt(evidence_pack: dict) -> str:
    """Render the capability assessment prompt with rubric and evidence."""
    return "\n\n".join(
        [
            SYSTEM_PROMPT,
            "<rubric>\n" + json.dumps(CAPABILITY_RUBRIC, ensure_ascii=False, indent=2) + "\n</rubric>",
            "<evidence_pack>\n"
            + json.dumps(evidence_pack, ensure_ascii=False, indent=2)
            + "\n</evidence_pack>",
        ]
    )
