# Work Context Project Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser `prompt()` in the Performance Coach "工作上下文" feature with a two-modal flow: project picker (multi-select from Career Portfolio) → edit form (pre-filled from selected projects).

**Architecture:** Backend field rename `linked_project_id` → `linked_project_ids` (JSONB array) with data migration. Frontend gets two new modal components (`ProjectPickerModal`, `ContextItemEditModal`) wired into `CoachContextTab` replacing the `prompt()` flow.

**Tech Stack:** FastAPI + SQLAlchemy (async), Alembic, PostgreSQL JSONB, React 19 + TypeScript, TanStack Query, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/src/models/coach_context.py:31` | Modify | Replace `linked_project_id` column with `linked_project_ids` JSONB |
| `backend/src/schemas/coach_context.py:11,26` | Modify | Update all 3 context item schemas to use `linked_project_ids` |
| `backend/alembic/versions/20260420_02_context_project_ids.py` | Create | Migration: add JSONB col, migrate data, drop old col |
| `frontend/src/types/index.ts:492,507,523` | Modify | Update TypeScript types for the field rename |
| `frontend/src/components/coach/ProjectPickerModal.tsx` | Create | Modal to multi-select projects from Career Portfolio |
| `frontend/src/components/coach/ContextItemEditModal.tsx` | Create | Edit form pre-filled from selected projects |
| `frontend/src/components/coach/CoachContextTab.tsx:33-44` | Modify | Replace `handleAddContext` with two-modal flow |

---

### Task 1: Backend — Update model field

**Files:**
- Modify: `backend/src/models/coach_context.py:31-35`

- [ ] **Step 1: Replace `linked_project_id` with `linked_project_ids` in model**

In `backend/src/models/coach_context.py`, replace the `linked_project_id` column (lines 31-35) with a JSONB column:

```python
    linked_project_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
```

The full `PerformanceContextItem` class should look like:

```python
class PerformanceContextItem(CommonBase):
    __tablename__ = "performance_context_items"

    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("career_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")

    linked_work_experience_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("work_experiences.id", ondelete="SET NULL"),
        nullable=True,
    )
    linked_project_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    linked_achievement_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    dimension_hints_json: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    priority: Mapped[str] = mapped_column(String(32), nullable=False, default="medium")
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    target_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    tasks: Mapped[list["PerformanceTask"]] = relationship(
        "PerformanceTask",
        back_populates="context_item",
        cascade="all, delete-orphan",
    )
    progress_entries: Mapped[list["PerformanceProgressEntry"]] = relationship(
        "PerformanceProgressEntry",
        back_populates="context_item",
        cascade="all, delete-orphan",
    )
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/coach_context.py
git commit -m "refactor(model): rename linked_project_id to linked_project_ids JSONB array"
```

---

### Task 2: Backend — Update Pydantic schemas

**Files:**
- Modify: `backend/src/schemas/coach_context.py:11,26`

- [ ] **Step 1: Update `PerformanceContextItemBase`, `PerformanceContextItemUpdate`, and `PerformanceContextItemResponse`**

In `backend/src/schemas/coach_context.py`, make these changes:

In `PerformanceContextItemBase` (line 11), replace `linked_project_id` with `linked_project_ids`:

```python
class PerformanceContextItemBase(BaseModel):
    title: str
    summary: str = ""
    status: str = "active"
    linked_work_experience_id: Optional[UUID] = None
    linked_project_ids: List[UUID] = Field(default_factory=list)
    linked_achievement_ids: List[UUID] = Field(default_factory=list)
    dimension_hints_json: Dict[str, Any] = Field(default_factory=dict)
    priority: str = "medium"
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
```

In `PerformanceContextItemUpdate` (line 26), replace `linked_project_id` with `linked_project_ids`:

```python
class PerformanceContextItemUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = None
    linked_work_experience_id: Optional[UUID] = None
    linked_project_ids: Optional[List[UUID]] = None
    linked_achievement_ids: Optional[List[UUID]] = None
    dimension_hints_json: Optional[Dict[str, Any]] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    target_date: Optional[datetime] = None
```

`PerformanceContextItemResponse` inherits from `PerformanceContextItemBase` so it gets `linked_project_ids` automatically — no change needed there.

- [ ] **Step 2: Commit**

```bash
git add backend/src/schemas/coach_context.py
git commit -m "refactor(schema): rename linked_project_id to linked_project_ids"
```

---

### Task 3: Backend — Create Alembic migration

**Files:**
- Create: `backend/alembic/versions/20260420_02_context_project_ids.py`

- [ ] **Step 1: Create the migration file**

Create `backend/alembic/versions/20260420_02_context_project_ids.py`:

```python
"""linked_project_id -> linked_project_ids JSONB array

Revision ID: 20260420_02
Revises: 7d8b3c4310c1
Create Date: 2026-04-20 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '20260420_02'
down_revision: Union[str, None] = '7d8b3c4310c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new JSONB column
    op.add_column(
        "performance_context_items",
        sa.Column("linked_project_ids", postgresql.JSONB(), nullable=False, server_default="[]"),
    )

    # 2. Migrate data: where linked_project_id IS NOT NULL, wrap it in an array
    op.execute(
        """
        UPDATE performance_context_items
        SET linked_project_ids = jsonb_build_array(linked_project_id::text::jsonb)
        WHERE linked_project_id IS NOT NULL
        """
    )

    # 3. Drop old column and its foreign key
    op.drop_constraint(
        "performance_context_items_linked_project_id_fkey",
        "performance_context_items",
        type_="foreignkey",
    )
    op.drop_column("performance_context_items", "linked_project_id")


def downgrade() -> None:
    # 1. Re-add old column
    op.add_column(
        "performance_context_items",
        sa.Column("linked_project_id", sa.UUID(), nullable=True),
    )

    # 2. Migrate back: take the first element from the array
    op.execute(
        """
        UPDATE performance_context_items
        SET linked_project_id = (linked_project_ids->>0)::uuid
        WHERE linked_project_ids IS NOT NULL
          AND jsonb_array_length(linked_project_ids) > 0
        """
    )

    # 3. Recreate foreign key
    op.create_foreign_key(
        "performance_context_items_linked_project_id_fkey",
        "performance_context_items",
        "projects",
        ["linked_project_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # 4. Drop new column
    op.drop_column("performance_context_items", "linked_project_ids")
```

- [ ] **Step 2: Run the migration**

Run: `cd backend && alembic upgrade head`
Expected: Migration applies without error.

- [ ] **Step 3: Commit**

```bash
git add backend/alembic/versions/20260420_02_context_project_ids.py
git commit -m "feat(migration): convert linked_project_id to linked_project_ids JSONB array"
```

---

### Task 4: Frontend — Update TypeScript types

**Files:**
- Modify: `frontend/src/types/index.ts:492,507,523`

- [ ] **Step 1: Update `PerformanceContextItem` interface**

In `frontend/src/types/index.ts`, change line 492 from `linked_project_id: string | null;` to:

```typescript
  linked_project_ids: string[];
```

- [ ] **Step 2: Update `PerformanceContextItemCreate` interface**

Change line 507 from `linked_project_id?: string | null;` to:

```typescript
  linked_project_ids?: string[];
```

- [ ] **Step 3: Update `PerformanceContextItemUpdate` interface**

Change line 523 from `linked_project_id?: string | null;` to:

```typescript
  linked_project_ids?: string[];
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "refactor(types): rename linked_project_id to linked_project_ids"
```

---

### Task 5: Frontend — Create ProjectPickerModal component

**Files:**
- Create: `frontend/src/components/coach/ProjectPickerModal.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/coach/ProjectPickerModal.tsx`:

```typescript
import { useState } from "react";
import { X, Check } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import type { Project } from "@/types";

interface ProjectPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (projects: Project[]) => void;
  alreadyLinkedProjectIds?: string[];
}

export function ProjectPickerModal({
  open,
  onClose,
  onConfirm,
  alreadyLinkedProjectIds = [],
}: ProjectPickerModalProps) {
  const { data: projects = [], isLoading } = useProjects();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = projects.filter((p) => selectedIds.has(p.id));
    onConfirm(selected);
    setSelectedIds(new Set());
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">选择项目</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-xs text-notion-gray-500">
          从你的职业档案中选择项目关联到此工作上下文
        </p>

        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-notion-gray-400">
              加载中...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center text-sm text-notion-gray-400">
              暂无项目，请先在职业档案中创建项目
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((project) => {
                const isSelected = selectedIds.has(project.id);
                const isLinked = alreadyLinkedProjectIds.includes(project.id);

                return (
                  <button
                    key={project.id}
                    onClick={() => toggleSelect(project.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-notion-blue bg-blue-50/30 ring-1 ring-notion-blue"
                        : "border-gray-200 bg-white hover:border-notion-blue/30"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-notion-blue bg-notion-blue text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {project.name}
                        </span>
                        {isLinked && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            已关联
                          </span>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-0.5 text-xs text-notion-gray-500 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {project.tech_stack.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="rounded bg-notion-bg-secondary px-1.5 py-0.5 text-[10px] text-notion-gray-500"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.tech_stack.length > 4 && (
                            <span className="text-[10px] text-notion-gray-400">
                              +{project.tech_stack.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-notion-gray-500">
            {selectedIds.size > 0 ? `${selectedIds.size} 个项目已选` : "未选择项目"}
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="rounded-md bg-notion-blue px-4 py-2 text-sm font-semibold text-white hover:bg-notion-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/coach/ProjectPickerModal.tsx
git commit -m "feat(coach): add ProjectPickerModal component for multi-select projects"
```

---

### Task 6: Frontend — Create ContextItemEditModal component

**Files:**
- Create: `frontend/src/components/coach/ContextItemEditModal.tsx`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/coach/ContextItemEditModal.tsx`:

```typescript
import { useState, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";
import type { Project } from "@/types";

interface ContextItemEditModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    summary: string;
    priority: string;
    linked_project_ids: string[];
    status: string;
  }) => void;
  isSubmitting: boolean;
  initialData: {
    title: string;
    summary: string;
    priority: string;
    linked_project_ids: string[];
  };
  projects: Project[];
}

export function ContextItemEditModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  initialData,
  projects,
}: ContextItemEditModalProps) {
  const [title, setTitle] = useState(initialData.title);
  const [summary, setSummary] = useState(initialData.summary);
  const [priority, setPriority] = useState(initialData.priority);

  if (!open) return null;

  const linkedProjects = projects.filter((p) =>
    initialData.linked_project_ids.includes(p.id)
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      summary,
      priority,
      linked_project_ids: initialData.linked_project_ids,
      status: "active",
    });
  };

  const handleClose = () => {
    setTitle(initialData.title);
    setSummary(initialData.summary);
    setPriority(initialData.priority);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">创建工作上下文</h3>
          <button
            onClick={handleClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="例如：项目 A 开发、Q3 绩效目标"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">简要描述</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="描述此工作上下文的目标和范围..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium">优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          {linkedProjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium">关联项目</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {linkedProjects.map((project) => (
                  <span
                    key={project.id}
                    className="inline-flex items-center gap-1 rounded-md bg-notion-bg-secondary px-2.5 py-1 text-xs font-medium text-notion-gray-700"
                  >
                    {project.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-notion-blue px-4 py-2 text-sm font-semibold text-white hover:bg-notion-blue/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/coach/ContextItemEditModal.tsx
git commit -m "feat(coach): add ContextItemEditModal with pre-filled project data"
```

---

### Task 7: Frontend — Wire modals into CoachContextTab

**Files:**
- Modify: `frontend/src/components/coach/CoachContextTab.tsx`

- [ ] **Step 1: Add imports and state for modal flow**

At the top of `CoachContextTab.tsx`, add the two new modal imports after the existing imports:

```typescript
import { ProjectPickerModal } from "./ProjectPickerModal";
import { ContextItemEditModal } from "./ContextItemEditModal";
import type { Project } from "@/types";
```

Add state variables inside the `CoachContextTab` function, after the existing `useState` for `selectedItem`:

```typescript
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
```

- [ ] **Step 2: Replace `handleAddContext` with two-modal flow**

Replace the entire `handleAddContext` function (lines 33-44) with:

```typescript
  const handlePickProjects = (projects: Project[]) => {
    setSelectedProjects(projects);
    setPickerOpen(false);
    setEditOpen(true);
  };

  const handleEditSubmit = (data: {
    title: string;
    summary: string;
    priority: string;
    linked_project_ids: string[];
    status: string;
  }) => {
    createContextItem.mutate(data, {
      onSuccess: () => {
        setEditOpen(false);
        setSelectedProjects([]);
      },
    });
  };
```

- [ ] **Step 3: Add the edit modal initial data derivation**

Add this computed value before the `if (loadingItems)` block:

```typescript
  const editInitialData = {
    title: selectedProjects.map((p) => p.name).join(", "),
    summary: selectedProjects
      .map((p) => p.description)
      .filter(Boolean)
      .join("\n"),
    priority: "medium" as const,
    linked_project_ids: selectedProjects.map((p) => p.id),
  };
```

- [ ] **Step 4: Add modal components to JSX**

Add the two modals just before the closing `</div>` of the component (the last line). Place them after the main grid div but before the final return closing tag:

```tsx
      <ProjectPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickProjects}
      />
      <ContextItemEditModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedProjects([]);
        }}
        onSubmit={handleEditSubmit}
        isSubmitting={createContextItem.isPending}
        initialData={editInitialData}
        projects={selectedProjects}
      />
```

- [ ] **Step 5: Update `onAdd` callback in ContextItemList**

Change the `onAdd` prop on `<ContextItemList>` from `onAdd={handleAddContext}` to `onAdd={() => setPickerOpen(true)}`:

```tsx
        <ContextItemList
          items={contextItems}
          selectedId={selectedItem?.id}
          onSelect={setSelectedItem}
          onAdd={() => setPickerOpen(true)}
        />
```

The complete updated `CoachContextTab.tsx` should look like:

```tsx
import { useState } from "react";
import {
  usePerformanceContextItems,
  useCreatePerformanceContextItem,
  usePerformanceTasks,
  useCreatePerformanceTask,
  useUpdatePerformanceTask,
  usePerformanceProgressEntries,
  useCreatePerformanceProgressEntry,
  useUpdatePerformanceProgressEntry
} from "@/hooks/useCoachContext";
import { ContextItemList } from "./ContextItemList";
import { TaskBoard } from "./TaskBoard";
import { ProgressLog } from "./ProgressLog";
import { ProjectPickerModal } from "./ProjectPickerModal";
import { ContextItemEditModal } from "./ContextItemEditModal";
import type { PerformanceContextItem, Project } from "@/types";
import { Loader2, Layout } from "lucide-react";

export function CoachContextTab() {
  const { data: contextItems = [], isLoading: loadingItems } = usePerformanceContextItems();
  const [selectedItem, setSelectedItem] = useState<PerformanceContextItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);

  const createContextItem = useCreatePerformanceContextItem();

  const selectedId = selectedItem?.id || "";
  const { data: tasks = [] } = usePerformanceTasks(selectedId);
  const { data: progressEntries = [] } = usePerformanceProgressEntries(selectedId);

  const createTask = useCreatePerformanceTask(selectedId);
  const updateTask = useUpdatePerformanceTask(selectedId);
  const createProgress = useCreatePerformanceProgressEntry(selectedId);
  const updateProgress = useUpdatePerformanceProgressEntry(selectedId);

  const handlePickProjects = (projects: Project[]) => {
    setSelectedProjects(projects);
    setPickerOpen(false);
    setEditOpen(true);
  };

  const handleEditSubmit = (data: {
    title: string;
    summary: string;
    priority: string;
    linked_project_ids: string[];
    status: string;
  }) => {
    createContextItem.mutate(data, {
      onSuccess: () => {
        setEditOpen(false);
        setSelectedProjects([]);
      },
    });
  };

  const handleAddTask = () => {
    if (!selectedId) return;
    const title = prompt("请输入任务标题:");
    if (title) {
      createTask.mutate({ title, status: "todo" });
    }
  };

  const handleAddProgress = () => {
    if (!selectedId) return;
    const title = prompt("请输入进展标题:");
    if (title) {
      const details = prompt("请输入进展详情 (支持 Markdown):");
      createProgress.mutate({
        title,
        details_markdown: details || "",
        status: "logged",
      });
    }
  };

  const editInitialData = {
    title: selectedProjects.map((p) => p.name).join(", "),
    summary: selectedProjects
      .map((p) => p.description)
      .filter(Boolean)
      .join("\n"),
    priority: "medium" as const,
    linked_project_ids: selectedProjects.map((p) => p.id),
  };

  if (loadingItems) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-notion-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <ContextItemList
          items={contextItems}
          selectedId={selectedItem?.id}
          onSelect={setSelectedItem}
          onAdd={() => setPickerOpen(true)}
        />
      </aside>

      <main className="min-h-[600px] rounded-xl border bg-white p-6 shadow-sm lg:p-8">
        {selectedItem ? (
          <div className="space-y-10">
            <header className="border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-notion-blue/10 text-notion-blue">
                  <Layout className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{selectedItem.title}</h1>
                  {selectedItem.summary && (
                    <p className="mt-1 text-sm text-notion-gray-500">{selectedItem.summary}</p>
                  )}
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-12 xl:grid-cols-[1fr_400px]">
              <div className="space-y-12">
                <section>
                  <ProgressLog
                    entries={progressEntries}
                    onAddEntry={handleAddProgress}
                    onUpdateStatus={(entryId, status) => updateProgress.mutate({ entryId, data: { status } })}
                  />
                </section>
              </div>

              <aside className="space-y-12">
                <section>
                  <TaskBoard
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onUpdateTask={(taskId, data) => updateTask.mutate({ taskId, data })}
                  />
                </section>
              </aside>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center py-20 text-center text-notion-gray-400">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-notion-bg-secondary">
              <Layout className="h-8 w-8 opacity-20" />
            </div>
            <h3 className="text-base font-medium text-foreground">未选择上下文</h3>
            <p className="mt-1 max-w-[240px] text-xs">
              从左侧列表中选择一个工作上下文，或者点击加号创建一个新的上下文。
            </p>
          </div>
        )}
      </main>

      <ProjectPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handlePickProjects}
      />
      <ContextItemEditModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setSelectedProjects([]);
        }}
        onSubmit={handleEditSubmit}
        isSubmitting={createContextItem.isPending}
        initialData={editInitialData}
        projects={selectedProjects}
      />
    </div>
  );
}
```

- [ ] **Step 6: Verify the app compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/coach/CoachContextTab.tsx
git commit -m "feat(coach): replace prompt() with project picker → edit modal flow"
```

---

### Task 8: End-to-end verification

- [ ] **Step 1: Start the backend**

Run: `cd backend && uvicorn src.main:app --reload --port 8000`
Expected: Server starts without errors.

- [ ] **Step 2: Run the migration**

Run: `cd backend && alembic upgrade head`
Expected: `Running upgrade ... -> 20260420_02, linked_project_id -> linked_project_ids JSONB array`

- [ ] **Step 3: Start the frontend dev server**

Run: `cd frontend && npm run dev`
Expected: Vite dev server starts, no compilation errors.

- [ ] **Step 4: Manual test flow**

1. Navigate to "绩效教练" → "工作上下文" tab
2. Click the '+' button → ProjectPickerModal opens (no more browser `prompt()`)
3. Select one or more projects → click "确认"
4. ContextItemEditModal opens with pre-filled title/summary from selected projects
5. Edit title/summary/priority as needed → click "创建"
6. New context item appears in the left sidebar with `linked_project_ids` populated
7. Click the context item → detail view loads correctly

- [ ] **Step 5: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: address e2e issues from project picker testing"
```
