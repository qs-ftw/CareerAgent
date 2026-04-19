---
name: check-work
description: Multi-dimensional code work analysis → CareerAgent achievement. Supports recent commits, module deep-dive, and project retrospective. Trigger: /check-work
trigger: /check-work
---

# /check-work

Analyze code work from multiple dimensions (recent commits, module ownership, project-level highlights), generate achievement drafts, interactively refine, and publish to CareerAgent.

## Prerequisites

Before starting, verify:
1. CareerAgent MCP server is connected (try calling `career_list_projects`)
2. CareerAgent backend is running at `localhost:8000`
3. You are in a git repository

If MCP tools are unavailable, tell the user: "CareerAgent MCP 服务未连接。请先启动后端并注册 MCP 服务。"

---

## Phase 0: Mode Selection

Present the user with three analysis modes:

> "请选择分析模式:
>
> **A. 最近提交** — 分析最近的 git commits，适合单次工作成果整理
> **B. 模块深挖** — 选择项目中某个模块/功能，从技术栈、架构、工程实践多维度深挖
> **C. 项目回顾** — 扫描整个项目，提取多个亮点模块，批量生成成果
>
> 输入 A/B/C 选择模式:"

Wait for user input, then branch to the corresponding mode flow.

---

## Mode A: Recent Commits

### A1. Context Collection

**If there are new commits in this session:**

1. Run `git log --oneline -20` to see recent commits
2. Run `git diff HEAD~N..HEAD --stat` (where N is the number of new commits) to see change summary
3. Run `git diff HEAD~N..HEAD` to see the actual changes (truncate if too large)
4. Review the current conversation to extract: requirements background, technical decisions, problem-solving approach

**If there are no new commits:**

Show `git log --oneline -15`, let user pick a range by commit count or hash, then analyze those commits.

### A2. Achievement Draft Generation

Synthesize gathered context into an achievement draft:

```
## 成果初稿

**标题**: [一句话概括，突出核心价值]

**原始内容**:
[Situation] ...
[Task] ...
[Action] ...
[Result] ...

**技术标签**: [tag1, tag2, ...]
**技术栈**: [tech1, tech2, ...]
```

Rules:
- Title: concise, highlight core value
- Raw content: follow STAR method, weave in decision context
- Tags: extract technical keywords from code diff and conversation
- Source type: always `code_session`

### A3 → Jump to Phase 3 (Interactive Editing)

---

## Mode B: Module Deep-Dive

### B1. Module Identification

Ask the user:

> "请指定要分析的模块/功能:
> - 可以是文件路径 (如 `backend/src/services/`)
> - 可以是功能描述 (如 '用户认证模块')
> - 可以是目录名 (如 `frontend/src/pages/`)"

Once specified, use Agent tool (subagent_type=Explore) to:
1. `git log --follow -- <path>` for ownership history
2. `git log --oneline -- <path>` for commit narrative (count commits, identify key changes)
3. `git log --format="%H %an %s" -- <path>` for author attribution
4. Read key files in the module for architecture and patterns
5. Detect dependencies and integration points

### B2. Multi-Dimensional Module Analysis

Analyze the module across 4 dimensions. Present as a structured card:

```
### 模块分析: [模块名]

**📊 代码规模**: X 个文件, Y 行代码, Z 次 commits
**👥 所有权**: [作者] 贡献了 N% 的 commits

#### 技术维度
- 后端技术: [frameworks, ORMs, middleware]
- 数据模式: [DB design, caching, data flow]
- 接口设计: [API patterns, auth, validation]
- 安全实践: [auth, input sanitization, secret management]

#### 工程维度
- 测试策略: [unit/integration/e2e coverage patterns]
- 错误处理: [error boundaries, retry, graceful degradation]
- 可观测性: [logging, metrics, tracing]
- CI/CD: [build, deploy, linting]

#### 架构维度
- 设计模式: [repository, service layer, CQRS, DDD, etc.]
- 数据流: [request lifecycle, event flow]
- 关注点分离: [layer boundaries, dependency direction]

#### 所有权维度
- 作用范围: [single function / module / cross-cutting system]
- 独立性: [solo-developed / co-developed / contributed]
- 决策权: [designed & implemented / implemented spec / reviewed]
```

### B3. Achievement Draft Generation

Based on the module analysis, generate achievement draft(s). Focus on:
- Module purpose and business value
- Technical decisions and trade-offs
- Patterns employed and why
- Engineering practices demonstrated
- Ownership scope and independence

Use the same draft format as A2.

### B4 → Jump to Phase 3 (Interactive Editing)

---

## Mode C: Project Retrospective

### C1. Full Project Scan

Run a comprehensive project scan using Agent tool (subagent_type=Explore):

1. `git log --oneline` — full commit history
2. `git ls-files` — file inventory
3. Detect tech stack from:
   - `requirements.txt` / `pyproject.toml` / `setup.py` → Python
   - `package.json` → Node.js / frontend
   - `go.mod` → Go
   - `Cargo.toml` → Rust
   - `pom.xml` / `build.gradle` → Java
4. `git shortlog -sn --all` — contributor overview
5. `git log --format="%H %s" | head -50` — recent narrative

### C2. Highlight Module Identification

Group files by feature area (directory structure + coupling analysis) and identify distinct "highlight modules":

```
### 项目概览

**项目**: [name from git remote or directory]
**技术栈**: [detected stack]
**总提交**: X commits by Y contributors
**文件规模**: Z files

### 亮点模块

1. **[模块名]** — [N commits, M files] — [一句话简介]
2. **[模块名]** — [N commits, M files] — [一句话简介]
3. **[模块名]** — [N commits, M files] — [一句话简介]
4. **[模块名]** — [N commits, M files] — [一句话简介]
...

选择要生成成果的模块 (可多选, 如 1,3 或 all): "
```

### C3. Per-Module Deep Analysis

For each selected module, run Mode B analysis (B1-B3) in sequence.

### C4 → Jump to Phase 3 (Interactive Editing)

Note: In Mode C, iterate through each module's draft interactively. Use a compact format:

```
### 成果 [1/N]: [模块名]

**标题**: ...
**内容**: ...

满意吗？(yes/edit/skip)
```

Collect all approved drafts, then proceed to Phase 4-5 as a batch.

---

## Phase 3: Interactive Editing (All Modes)

Present the draft and ask:

> "以上是根据你的工作自动生成的成果初稿。你觉得如何？需要调整哪些部分？"

Interactive refinement loop:
1. If user wants to change specific fields, edit them and re-show
2. If user provides additional information, incorporate it
3. Ask follow-up questions to enrich the content (STAR gaps) — pick 1-2 most relevant:
   - "这个工作的背景/业务场景是什么？"
   - "你解决了什么核心问题？为什么重要？"
   - "方案设计时考虑了哪些替代方案？为什么选了这个？"
   - "有没有可量化的成果？（性能提升、bug减少、用户影响等）"
   - "这个模块你独立负责了哪些部分？"
   - "用到了哪些 engineering 最佳实践？"
4. Use encouraging, warm tone but keep it concise for terminal

Continue until the user is satisfied or says "OK"/"可以了"/"够了"/"发布".

---

## Phase 4: Deep Local Analysis (All Modes)

Run four analysis dimensions for each achievement. Present results as a structured card.

### 4a. Technical Analysis

Based on the code changes and context, identify:
- Technologies and architectural patterns used
- Core technical decisions and their rationale
- Complex problems solved and solutions adopted

```
### 技术分析

**技术要点**:
- point 1
- point 2

**挑战与方案**:
- 挑战: ... → 方案: ...

**架构决策**:
- decision: why it was chosen
```

### 4b. Capability Analysis

Identify demonstrated skills from the work:
- Problem analysis and diagnosis
- Solution design and evaluation
- Technical leadership and decision-making
- Engineering practices (testing, error handling, observability)
- Ownership and initiative

```
### 能力分析

**体现的能力**:
- [capability]: evidence from the work

**面试要点**:
- 面试中可以这样表述: ...
```

### 4c. Project Association

1. Call `career_list_projects` MCP tool to get existing projects
2. Based on code change paths and tech stack, suggest the best matching project
3. If no match, suggest creating a new project with auto-filled fields

```
### 项目关联

**推荐关联到**: [project name] (id: xxx)
理由: ...

或者 [新建项目]:
- 名称: ...
- 描述: ...
- 技术栈: ...
```

Ask user to confirm or adjust.

### 4d. Role Matching

1. Call `career_list_roles` MCP tool to get target roles
2. Analyze achievement content against each role
3. Only include roles with match_score >= 0.3

```
### 角色匹配

- **[Role name]**: 匹配度 0.8 — 原因: ...
- **[Role name]**: 匹配度 0.5 — 原因: ...
```

---

## Phase 5: Review and Publish (All Modes)

Show the final achievement card:

```
## 最终成果

**标题**: ...
**关联项目**: ...
**标签**: ...
**技术栈**: ...
**来源**: code_session

**内容**:
...

**分析数据**:
- 技术要点: ...
- 挑战与方案: ...
- 能力标签: ...
- 角色匹配: ...

确认发布到 CareerAgent？(yes/no)
```

If user confirms:
1. If creating a new project: call `career_create_project` first, get the project_id
2. Call `career_create_achievement` with all fields
3. Call `career_update_achievement` to store analysis results as `parsed_data`

On success, report:
> "成果已发布！Achievement ID: {id}"

For Mode C with multiple achievements, publish each one and report:
> "已发布 N 个成果！IDs: {id1}, {id2}, ..."

---

## Error Handling

| Scenario | Action |
|----------|--------|
| MCP tools unavailable | Tell user to start MCP server and backend |
| Backend unreachable | Tell user to start CareerAgent backend (`make dev` or `docker-compose up`) |
| Not a git repo | Tell user this command only works in git repositories |
| API returns 404/422 | Show the error details and suggest checking the data |
| Module not found in Mode B | Ask user to specify a different path or description |
