# Work Context Project Picker Design

## Problem

The Performance Coach's "工作上下文" feature uses browser `prompt()` to create context items with free-text input. Users want to create context by selecting existing projects from their Career Portfolio, with multi-project support and pre-editing.

## Requirements

1. Click '+' opens a modal (not browser prompt) to select projects
2. Multi-select: one context can link to multiple projects
3. After selection, user can edit title/description/priority before creating
4. User typically maintains a single active context

## Design

### 1. Data Model Change

**Model** (`backend/src/models/coach_context.py` — `PerformanceContextItem`):

- Replace `linked_project_id: UUID | None` with `linked_project_ids: list[UUID]` (JSONB, default=[])
- Matches existing pattern of `linked_achievement_ids`

**Schema** (`backend/src/schemas/coach_context.py`):

- `PerformanceContextItemBase`: `linked_project_ids: list[UUID] = Field(default_factory=list)` replaces `linked_project_id`
- `PerformanceContextItemUpdate`: `linked_project_ids: Optional[list[UUID]] = None` replaces `linked_project_id`
- `PerformanceContextItemResponse`: same as base

**Migration** (`backend/alembic/versions/20260420_02_context_project_ids.py`):

1. Add `linked_project_ids` JSONB column (default `[]`)
2. Migrate: where `linked_project_id IS NOT NULL`, set `linked_project_ids = jsonb_build_array(linked_project_id)`
3. Drop `linked_project_id` column

### 2. Frontend: ProjectPickerModal Component

**File**: `frontend/src/components/coach/ProjectPickerModal.tsx`

**Props**:
```typescript
{
  open: boolean;
  onClose: () => void;
  onConfirm: (projects: Project[]) => void;
  alreadyLinkedProjectIds?: string[];  // projects already linked to other contexts
}
```

**Behavior**:
- On open, loads projects via `useProjects` hook
- Displays project cards in a scrollable list, each with a checkbox
- Projects already linked to other contexts show an "已关联" badge but remain selectable
- Multi-select via checkboxes
- Bottom bar: "{N} 个项目已选" + "确认" button
- "确认" calls `onConfirm(selectedProjects)`

### 3. Frontend: ContextItemEditModal Component

**File**: `frontend/src/components/coach/ContextItemEditModal.tsx`

**Props**:
```typescript
{
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContextItemPayload) => void;
  isSubmitting: boolean;
  initialData: {
    title: string;
    summary: string;
    priority: string;
    linked_project_ids: string[];
  };
}
```

**Behavior**:
- Form fields: title (input), summary (textarea), priority (select: high/medium/low)
- Shows linked project names as read-only tags
- "创建" button calls `onSubmit`
- Pre-filled from selected projects: title = comma-joined project names, summary = concatenated descriptions

### 4. CoachContextTab Changes

**File**: `frontend/src/components/coach/CoachContextTab.tsx`

**Flow change** for `handleAddContext`:
1. Open `ProjectPickerModal`
2. User selects projects → clicks "确认"
3. Open `ContextItemEditModal` with pre-filled data from selected projects
4. User edits → clicks "创建"
5. Call `createContextItem.mutate({ title, summary, priority, linked_project_ids, status: "active" })`

Remove: all `prompt()` calls in `handleAddContext`.

### 5. Files Changed

| File | Change |
|------|--------|
| `backend/src/models/coach_context.py` | `linked_project_id` → `linked_project_ids` |
| `backend/src/schemas/coach_context.py` | Same field rename in all schemas |
| `backend/src/services/coach_context_service.py` | Update field references |
| `backend/alembic/versions/20260420_02_*.py` | New migration |
| `frontend/src/components/coach/ProjectPickerModal.tsx` | New component |
| `frontend/src/components/coach/ContextItemEditModal.tsx` | New component |
| `frontend/src/components/coach/CoachContextTab.tsx` | Replace prompt() with modal flow |
| `frontend/src/types/index.ts` | Update PerformanceContextItem type |
