from typing import Any, Dict, List

def render_weekly_action_suggestion_prompt(context: Dict[str, Any]) -> str:
    """
    Render prompt for generating weekly action suggestions based on OKRs, gaps, and performance context.
    """
    snapshot = context.get("snapshot", {})
    objectives = context.get("objectives", [])
    performance_context = context.get("performance_context", [])

    prompt = f"""你是一位资深的绩效教练和职业发展专家。你的目标是根据用户当前的能力差距评估、个人 OKR 以及正在进行的日常工作上下文，为他们建议 3-5 条高价值的本周行动建议。

### 1. 能力评估快照 (Capability Assessment Snapshot)
- **核心层级 (Core Level):** {snapshot.get('core_level', 'Unknown')}
- **下一等级差距 (Next Level Gaps):** {snapshot.get('next_level_gaps', [])}
- **建议的长期动作 (Suggested Long-term Actions):** {snapshot.get('suggested_actions', [])}

### 2. 个人 OKR (活跃中)
"""
    for obj in objectives:
        prompt += f"- 目标 (Objective): {obj.title} (状态: {obj.status})\n"
        for kr in obj.key_results:
            prompt += f"  - 关键结果 (Key Result): {kr.title} (状态: {kr.status})\n"

    prompt += "\n### 3. 当前工作上下文与任务 (Performance Context & Tasks)\n"
    for item in performance_context:
        prompt += f"- 上下文 (Context): {item.title} (优先级: {item.priority})\n"
        for task in item.tasks:
            prompt += f"  - 任务 (Task): {task.title} (状态: {task.status})\n"

    prompt += """
### 指令 (Instructions):
基于以上信息，为接下来的这一周生成 3-5 条具体、可操作且高价值的行动建议。
- 这些行动应有助于缩小能力差距，同时推进 OKR 的达成。
- 考虑当前工作上下文的优先级。
- **所有输出内容（包括 reasoning, title, description）必须使用中文。**
- 为每条建议提供：标题 (title)、详细描述 (description) 和优先级 (priority: high, medium, low)。
- 如果某条建议直接关联到特定的 OKR 或关键结果 (Key Result)，请指明其 ID。

请以严格的 JSON 格式返回响应：
{{
    "reasoning": "简要说明为什么要选择这些行动建议。",
    "suggestions": [
        {{
            "title": "行动标题",
            "description": "详细的行动描述",
            "priority": "high/medium/low",
            "related_okr_id": "UUID 或 null",
            "related_kr_id": "UUID 或 null"
        }},
        ...
    ]
}}
"""
    return prompt
