# Design Spec: Performance Coach Workspace

## 1. Objective

Build a new top-level `绩效教练` workspace that helps the user grow inside their current role using the five-dimension capability model defined in [docs/feishu_PNAQwdEMniJXnbkVZKScrbSmnKb.md](/Users/gaoqiangsheng/work/playground/CareerAgent/docs/feishu_PNAQwdEMniJXnbkVZKScrbSmnKb.md).

The product goal is not generic career advice. It is a proof-based growth system that:

1. Evaluates the user's current proven capability level using the Feishu capability model
2. Binds current work into structured context that can become evidence
3. Organizes personal OKRs around capability growth and promotion evidence
4. Generates weekly plans, weekly reports, and re-assesses capability based on completed work

The required delivery order is:

1. `A` Capability rating and promotion evidence display
2. `D` Current work context binding
3. `B` Personal OKR management
4. `C` Weekly report, weekly reflection, re-evaluation, and improvement guidance

---

## 2. Source of Truth

### 2.1 Capability Standard

The only grading standard for v1 is the Feishu capability model document:

- [docs/feishu_PNAQwdEMniJXnbkVZKScrbSmnKb.md](/Users/gaoqiangsheng/work/playground/CareerAgent/docs/feishu_PNAQwdEMniJXnbkVZKScrbSmnKb.md)

No external career ladder, company rubric, or user-written self-description overrides this model in v1.

### 2.2 Evidence Rule

Capability ratings may only use system-bound evidence.

Allowed evidence sources:

- Existing `work_experiences`
- Existing `projects`
- Existing `achievements`
- Existing `interview_stories`
- New work-context progress records that are explicitly linked to the objects above

Not allowed as direct rating evidence:

- Pure free-text self claims
- Unlinked notes
- AI inference without concrete linked artifacts

If evidence is insufficient, the system must output `未证明` rather than guessing.

---

## 3. Product Principles

### 3.1 Proof Over Persona

The system is a performance coach, not a motivational chat bot. It should prioritize:

- traceable evidence
- explicit promotion gaps
- actionable next steps

over:

- broad encouragement
- vague self-improvement language
- unsupported rating inflation

### 3.2 Growth Loop Must Stay Closed

The workspace should preserve a single loop:

`existing assets -> current work context -> progress -> evidence -> capability rating -> OKR and weekly actions -> weekly review -> updated rating`

This is why v1 should live inside one top-level workspace rather than being split across multiple unrelated pages.

### 3.3 Do Not Build a Generic Task Manager

The work-context area is not a Jira replacement. It exists to capture work that can become promotion evidence.

### 3.4 Core Level Is the Primary Conclusion

The main rating shown to the user must be `Core C1-C4`. Five-dimension ratings explain that conclusion, but do not replace it.

---

## 4. Scope Decomposition

This feature is too large to implement as a single undifferentiated page. It should be decomposed into four sequential subsystems, all inside one `绩效教练` workspace.

### Phase 1: Capability Rating

Deliver:

- top-level `绩效教练` page shell
- `能力总览` view
- capability rating engine
- evidence mapping and gap display

### Phase 2: Work Context Binding

Deliver:

- `工作上下文` view
- bind current work to existing work experience / project / achievement context
- capture progress records
- promote finished progress into evidence candidates

### Phase 3: Personal OKR

Deliver:

- `个人 OKR` view
- OKRs mapped to capability gaps
- KR linkage to work-context items and evidence outcomes
- weekly action suggestions derived from OKR + gaps

### Phase 4: Weekly Review

Deliver:

- `周报复盘` view
- manager-facing weekly report
- self reflection
- incremental re-rating
- concrete improve suggestions for next week

---

## 5. Information Architecture

### 5.1 Global Navigation

Add a new top-level sidebar item:

- `绩效教练` -> route `/coach`

Reason:

- This feature has its own mental model and workflow
- It should not be hidden inside `岗位目标`, `Gap 看板`, or `职业履历`
- The user needs one stable home for rating, evidence, OKR, and weekly review

### 5.2 Internal Workspace Layout

The workspace should be a single page shell with four primary views:

1. `能力总览`
2. `工作上下文`
3. `个人 OKR`
4. `周报复盘`

Use tabs or segmented navigation inside `/coach`. Do not split these into separate sidebar entries in v1.

### 5.3 Right Rail

Keep a persistent right-side `教练建议栏` inside the workspace. It should summarize:

- top 3 high-value actions for this week
- highest-priority evidence gaps
- most likely path to the next Core level

This right rail is advisory only. It should consume data from the active view and the latest capability assessment snapshot.

---

## 6. View Design

### 6.1 View 1: 能力总览

This is the default landing view for `/coach`.

#### Required UI Blocks

- `当前等级`
  - primary badge: current proven `Core C1-C4`
  - explicit label: `当前被证明达到`
- `五维画像`
  - five-dimension radar
  - each dimension shows current proven `L1-L4`
- `等级解释`
  - 3-5 evidence-backed reasons for the current Core level
- `下一等级缺口`
  - explicit missing conditions for next Core level
- `维度超前提示`
  - when a single dimension has stronger evidence than current Core level, show this tension clearly

#### Expected User Questions This View Must Answer

- Where am I now?
- Why does the system think that?
- What is my next level?
- What evidence am I missing?
- Which dimensions are strongest or weakest?

### 6.2 View 2: 工作上下文

This view manages current-role execution context.

It should not be a general-purpose task board. It should manage current work that may create evidence.

#### Required UI Blocks

- `当前绑定上下文`
  - 3-7 active context items
  - each linked to an existing work experience, project, or achievement theme
- `任务与进展`
  - tasks: planned actions
  - progress records: completed facts and outcomes
- `证据转化`
  - mark a progress record as:
    - `未形成证据`
    - `可作为证据`
    - `已纳入本次评估`
- `能力维度提示`
  - explain which capability dimensions this context item is likely to support

#### Important Rule

Separate these concepts cleanly:

- task = intended action
- progress = factual update
- evidence = structured interpretation of a factual update

Do not collapse them into one mixed text field.

### 6.3 View 3: 个人 OKR

This view manages only personal OKRs.

#### Required Rules

- Every Objective must support capability growth or promotion evidence
- Every KR must be an outcome, not a to-do list item
- Every KR must link to at least one work-context item or evidence-producing result

#### Required UI Blocks

- `OKR 总览`
  - 2-3 active objectives
  - progress, risk, capability mapping
- `KR 详情`
  - measurable outcome definition
  - linked work context
  - current supporting evidence
- `本周建议动作`
  - generated from gaps + OKR + context state

### 6.4 View 4: 周报复盘

This view closes the loop.

#### Required UI Blocks

- `经理周报`
  - manager-facing weekly summary
- `证据总结`
  - what new evidence was produced this week
- `能力变化`
  - whether this week's evidence changes dimension levels or Core level
- `下周建议`
  - 3 concrete, high-value next actions

#### Required Behaviors

- Generate weekly report from system facts only
- Support self-reflection separate from manager report
- Trigger incremental re-evaluation after new weekly evidence
- If evidence is not strong enough to change rating, say so explicitly

---

## 7. Core Domain Model

The design should reuse current data as much as possible and add the minimum new objects required for the coaching loop.

### 7.1 Existing Objects to Reuse

Current models already provide the long-term evidence foundation:

- `work_experiences`
- `projects`
- `achievements`
- `interview_stories`
- `gap_items` as a reusable pattern for gap surfacing, though not the grading standard

### 7.2 New Objects

#### A. `performance_context_items`

Represents a current focus area inside the user's active job context.

Suggested fields:

- `id`
- `profile_id`
- `title`
- `summary`
- `status` (`active`, `paused`, `done`, `archived`)
- `linked_work_experience_id` nullable
- `linked_project_id` nullable
- `linked_achievement_ids` list
- `dimension_hints_json`
- `priority`
- `start_date`
- `target_date`

Purpose:

- the "container" for current work that may produce evidence

#### B. `performance_tasks`

Represents planned actions under a context item.

Suggested fields:

- `id`
- `context_item_id`
- `title`
- `description`
- `status`
- `due_date`
- `sort_order`

Purpose:

- planning and execution tracking only
- not direct evidence

#### C. `performance_progress_entries`

Represents factual progress updates.

Suggested fields:

- `id`
- `context_item_id`
- `title`
- `details_markdown`
- `status` (`logged`, `candidate_evidence`, `accepted_evidence`, `discarded`)
- `result_summary`
- `metrics_json`
- `linked_project_id` nullable
- `linked_achievement_ids` list
- `dimension_evidence_json`
- `occurred_at`

Purpose:

- factual record of work completed
- candidate source for capability evidence

#### D. `capability_assessment_snapshots`

Stores each capability evaluation event.

Suggested fields:

- `id`
- `profile_id`
- `assessment_scope` (`manual`, `weekly_review`, `okr_refresh`, `full_refresh`)
- `core_level`
- `core_reasoning_markdown`
- `dimension_levels_json`
- `dimension_scores_json` optional display aid
- `evidence_links_json`
- `next_level_gap_json`
- `created_at`

Purpose:

- preserve rating history
- power "what changed this week"

#### E. `personal_okrs` and `personal_key_results`

Needed in Phase 3 only.

Suggested fields:

- Objective:
  - `id`
  - `profile_id`
  - `title`
  - `summary`
  - `status`
  - `target_core_level`
  - `linked_dimensions_json`
- Key Result:
  - `id`
  - `objective_id`
  - `title`
  - `result_definition`
  - `status`
  - `progress_value_json`
  - `linked_context_item_ids`
  - `linked_evidence_ids`

#### F. `weekly_review_runs`

Needed in Phase 4 only.

Suggested fields:

- `id`
- `profile_id`
- `week_start`
- `week_end`
- `manager_report_markdown`
- `self_reflection_markdown`
- `new_evidence_json`
- `suggested_next_actions_json`
- `assessment_snapshot_id`

---

## 8. Evidence Flow

The feature should implement this canonical flow:

1. Existing assets exist in `work_experiences`, `projects`, `achievements`, `stories`
2. User binds current work into `performance_context_items`
3. User plans actions as `performance_tasks`
4. User records completed work as `performance_progress_entries`
5. System evaluates whether a progress entry qualifies as evidence
6. Accepted evidence is mapped to one or more capability dimensions
7. Capability engine generates a new `capability_assessment_snapshot`
8. Snapshot drives:
   - current level display
   - next-level gap display
   - OKR suggestions
   - weekly actions
   - weekly report deltas

The most important invariant:

- weekly reports and OKRs may consume evidence
- they may not create rating evidence out of thin air

---

## 9. Capability Rating Engine

### 9.1 Rating Structure

Use a two-layer model with one primary conclusion:

- Primary conclusion: `Core C1-C4`
- Explanatory layer: five dimensions each rated `L1-L4`

### 9.2 Core Rating Rule

The current proven Core level must be determined directly from the Feishu document's `Core 四层能力矩阵` and `逐层详解`.

The system should evaluate from low to high:

1. Check whether C1 evidence threshold is met
2. Then C2
3. Then C3
4. Then C4

Stop at the first level whose evidence threshold is not satisfied. The prior level is the current proven level.

### 9.3 Dimension Rating Rule

For each dimension:

- evaluate from L1 upward
- require linked evidence for each level jump
- if the next level lacks proof, stop at the current proven level
- if even L1 is unsupported, output `未证明`

### 9.4 No Pure Average Score

Do not compute Core level by averaging five-dimension scores.

Reason:

- The source document defines Core levels using concrete behavior anchors and outcomes
- Averaging would blur important threshold gaps such as owner-level delivery, cross-team standards, and external influence

### 9.5 Evidence Threshold Style

v1 should use a threshold-based and proof-backed rating system, not a fuzzy percentile system.

The system may still compute hidden support counts or confidence internally, but must present results as:

- proven
- partially supported
- unproven

### 9.6 Rating Output Format

The rating engine must always return:

- `current_core_level`
- `core_level_reasoning`
- `dimension_levels`
- `top_supporting_evidence`
- `next_level_missing_evidence`
- `dimension_overperformance_signals`

### 9.7 Dimension Overperformance

If a dimension has stronger evidence than the user's current Core level would suggest, show this explicitly.

Example:

- `高执行力 evidence is approaching L3, but Core remains C1 because owner-level and systemization evidence is missing`

This prevents the user from feeling "underrated" without explanation.

---

## 10. Prompt and Evaluation Design

### 10.1 Prompting Pattern

The capability engine should not rely on one monolithic prompt string embedded inline in Python. The system should move toward structured prompt composition.

Recommended direction:

- keep prompt content in dedicated prompt files
- pass linked evidence and rubric sections in structured blocks
- require explicit output schema for:
  - core level
  - dimension levels
  - evidence references
  - missing evidence

### 10.2 Why Structured Prompting Matters

This feature is high-risk for hallucinated capability inflation. The prompt should make evidence boundaries explicit.

Useful reference:

- `mdx-prompt` demonstrates composable prompt design and includes real-world examples from bragdoc.ai, a product for achievement logging and performance-review generation  
  https://github.com/edspencer/mdx-prompt

### 10.3 Capability Coach Prompt Constraints

Required constraints for the capability-rating prompt:

- never claim capability without linked evidence
- never treat free-text ambition as evidence
- if evidence is ambiguous, mark as partial support or unproven
- cite the exact linked artifacts used for each conclusion
- distinguish between:
  - proven current level
  - likely next-level potential
  - missing evidence

---

## 11. External Research and Reusable Ideas

The user requested research on useful skills or prompts. These sources are worth incorporating conceptually:

### 11.1 Dex

Source:

- https://github.com/davekilleen/Dex

Key idea to reuse:

- career evidence compounds over time
- daily work, weekly review, and project completion should feed a long-lived evidence system

Use in this design:

- informs the coaching loop and the weekly review model
- reinforces keeping the data user-owned and evidence-oriented

### 11.2 Lark OKR Skill

Source:

- https://skills.sh/larksuite/cli/lark-okr

Key idea to reuse:

- model OKRs as explicit Objective / KR entities
- keep future Feishu OKR integration possible

Use in this design:

- informs Phase 3 data model and later external sync path

### 11.3 Setting OKRs & Goals

Source:

- https://skills.sh/refoundai/lenny-skills/setting-okrs-goals

Key ideas to reuse:

- OKRs should bridge strategy to execution
- KRs must be outcomes, not task lists
- simple goals create stronger prioritization than overloaded plans

Use in this design:

- constrain personal OKR authoring
- prevent the OKR view from degrading into a to-do manager

---

## 12. Integration With Existing Codebase

### 12.1 Frontend Reuse

Current frontend already has:

- sidebar navigation
- React Router route structure
- page-per-workspace organization
- TanStack Query data hooks

This feature should follow the existing pattern:

- add `/coach` route in `frontend/src/App.tsx`
- add one sidebar item in `frontend/src/components/layout/Sidebar.tsx`
- create a new top-level page shell in `frontend/src/pages/PerformanceCoach.tsx`
- add view-specific child components rather than a giant single file

### 12.2 Backend Reuse

Current backend already has:

- models for achievements, projects, work experiences, stories
- agent/prompt patterns
- gap and dashboard service conventions
- REST API style with dedicated service modules

This feature should follow the same pattern:

- new models + schemas + services + API routers
- do not overload `gap_items` to become the capability rating store
- capability ratings are a different concern than target-role gap analysis

---

## 13. API Shape

Exact endpoints can be finalized during implementation planning, but the design expects these API groups.

### Phase 1: Capability Rating

- `GET /coach/assessment/latest`
- `GET /coach/assessments`
- `POST /coach/assessment/refresh`
- `GET /coach/evidence-summary`

### Phase 2: Work Context

- `GET /coach/context-items`
- `POST /coach/context-items`
- `PATCH /coach/context-items/:id`
- `GET /coach/context-items/:id/progress`
- `POST /coach/context-items/:id/tasks`
- `POST /coach/context-items/:id/progress`
- `PATCH /coach/progress/:id`

### Phase 3: Personal OKR

- `GET /coach/okrs`
- `POST /coach/okrs`
- `PATCH /coach/okrs/:id`
- `POST /coach/okrs/:id/key-results`
- `PATCH /coach/key-results/:id`
- `GET /coach/weekly-actions`

### Phase 4: Weekly Review

- `POST /coach/weekly-reviews/generate`
- `GET /coach/weekly-reviews`
- `GET /coach/weekly-reviews/:id`

---

## 14. Phased Delivery Detail

### Phase 1 Deliverable

The user can open `/coach` and see:

- current Core level
- five-dimension status
- supporting evidence
- next-level evidence gaps

No current-work editing is required yet, but the system must already be able to rate from existing assets.

### Phase 2 Deliverable

The user can:

- bind current work to reusable context items
- log tasks and progress
- see which updates may count as capability evidence

### Phase 3 Deliverable

The user can:

- define personal objectives
- define KR outcomes
- connect them to current work and gaps
- get weekly suggested actions

### Phase 4 Deliverable

The user can:

- generate a manager-ready weekly report
- reflect on what created evidence this week
- trigger a new capability snapshot
- receive specific improvement suggestions

---

## 15. Non-Goals

v1 should explicitly not do these things:

- replace Jira, Feishu Tasks, or GitHub Issues as a full task platform
- support company/team/org-wide OKR hierarchies
- support free-text self-assessment as rating evidence
- support multiple grading rubrics beyond the Feishu capability model
- infer external industry influence unless such artifacts are explicitly stored in-system

---

## 16. Risks and Design Guards

### 16.1 Hallucinated Promotion Inflation

Risk:

- the model overstates capability based on limited evidence

Guard:

- strict evidence-only prompt constraints
- citation of linked artifacts in every conclusion
- `未证明` as a first-class output

### 16.2 Task-Tracker Drift

Risk:

- the work-context view grows into a generic task manager

Guard:

- only keep context items that are likely to create evidence
- separate tasks from progress from evidence

### 16.3 OKR as Checklist

Risk:

- KRs become task lists

Guard:

- KR authoring rules require measurable outcome language
- KR must link to context and evidence-producing results

### 16.4 Rubric Ambiguity

Risk:

- Core levels and five-dimension levels diverge confusingly

Guard:

- Core is always primary
- dimension overperformance is shown explicitly
- next-level missing evidence is listed explicitly

---

## 17. Recommended Implementation Strategy

Implement in the same order the user specified:

1. Phase 1 capability engine and overview UI
2. Phase 2 work-context binding and progress logging
3. Phase 3 personal OKR
4. Phase 4 weekly review and re-rating

Reason:

- The capability model is the heart of the feature
- Work context is needed before OKR and weekly review can produce useful outputs
- Weekly review is the final consumer of all earlier systems

---

## 18. Approval Gate for Planning

After this spec is reviewed and approved, the next artifact should be a detailed implementation plan covering:

- file structure and ownership
- schema changes and migrations
- backend services and APIs
- frontend routes, page shell, and view components
- prompt contract and test strategy
- phased verification path
