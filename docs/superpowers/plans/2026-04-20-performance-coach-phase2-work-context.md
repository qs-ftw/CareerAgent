# Performance Coach Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build Phase 2 of the approved Performance Coach spec: the `工作上下文` (Work Context) view. This involves creating new data models for context items, tasks, and progress entries, exposing REST APIs for them, and building the frontend UI.

**Architecture:**
- **Backend:** 3 new SQLAlchemy models (`PerformanceContextItem`, `PerformanceTask`, `PerformanceProgressEntry`), new CRUD services, and endpoints in `src/api/coach.py`.
- **Frontend:** Implement the `工作上下文` tab in the existing `/coach` workspace. Create TanStack queries and React components to display context items, add tasks, and record progress.

## File Structure

### Backend

- Create: `backend/src/models/coach_context.py`
  - Defines `PerformanceContextItem`, `PerformanceTask`, and `PerformanceProgressEntry`.
- Modify: `backend/src/models/__init__.py`
  - Export new models.
- Create: `backend/src/schemas/coach_context.py`
  - Pydantic schemas for API validation.
- Create: `backend/src/services/coach_context_service.py`
  - CRUD logic for context items, tasks, and progress entries.
- Modify: `backend/src/api/coach.py`
  - Add routes for `GET/POST/PATCH` context-items, tasks, and progress.
- Create: `backend/alembic/versions/20260420_01_add_performance_context.py`
  - Alembic migration for the 3 new tables.
- Create: `backend/tests/test_services/test_coach_context_service.py`
  - Service tests.
- Create: `backend/tests/test_api/test_coach_context_api.py`
  - API contract tests.

### Frontend

- Modify: `frontend/src/types/index.ts`
  - Add context item, task, and progress entry types.
- Modify: `frontend/src/lib/api.ts`
  - Add coach context API functions.
- Create: `frontend/src/hooks/useCoachContext.ts`
  - TanStack query and mutation hooks.
- Create: `frontend/src/components/coach/CoachContextTab.tsx`
  - Top-level component for the context view.
- Modify: `frontend/src/pages/PerformanceCoach.tsx`
  - Wire up the context tab to switch views and un-disable it.
- Create: `frontend/src/components/coach/ContextItemList.tsx`
- Create: `frontend/src/components/coach/ContextItemCard.tsx`
- Create: `frontend/src/components/coach/TaskBoard.tsx`
- Create: `frontend/src/components/coach/ProgressLog.tsx`
- Create: `frontend/src/pages/__tests__/CoachContext.test.tsx`

---

## Task 1: Data Models and Migrations

- [x] Create `backend/src/models/coach_context.py` with `PerformanceContextItem`, `PerformanceTask`, `PerformanceProgressEntry`.
  - Ensure foreign keys correctly reference `CareerProfile`, `WorkExperience`, `Project`, etc.
- [x] Export them in `backend/src/models/__init__.py`.
- [x] Generate an Alembic migration (`20260420_01_add_performance_context.py`) for the new tables.

## Task 2: Backend Schemas and Services

- [x] Create `backend/src/schemas/coach_context.py` for request and response models.
- [x] Implement `backend/src/services/coach_context_service.py` with CRUD operations.
- [x] Add service tests in `backend/tests/test_services/test_coach_context_service.py` and verify they pass.

## Task 3: Backend API Endpoints

- [x] Extend `backend/src/api/coach.py` with endpoints:
  - `GET /coach/context-items`
  - `POST /coach/context-items`
  - `PATCH /coach/context-items/{id}`
  - `GET /coach/context-items/{id}/tasks`
  - `POST /coach/context-items/{id}/tasks`
  - `PATCH /coach/tasks/{id}`
  - `GET /coach/context-items/{id}/progress`
  - `POST /coach/context-items/{id}/progress`
  - `PATCH /coach/progress/{id}`
- [x] Add API tests in `backend/tests/test_api/test_coach_context_api.py` and verify they pass.

## Task 4: Frontend Data Contracts and Route State

- [x] Update `frontend/src/types/index.ts` with new interfaces.
- [x] Add API methods to `frontend/src/lib/api.ts`.
- [x] Create `frontend/src/hooks/useCoachContext.ts`.
- [x] In `frontend/src/pages/PerformanceCoach.tsx`, enable the "工作上下文" tab and add state to switch between `overview` and `context` views.

## Task 5: Frontend Components

- [x] Create `frontend/src/components/coach/CoachContextTab.tsx` as the main view container.
- [x] Create `ContextItemList.tsx` to list active context items.
- [x] Inside each context item, create `TaskBoard.tsx` (to show planned tasks) and `ProgressLog.tsx` (to record and promote factual updates).
- [x] Add frontend tests in `frontend/src/pages/__tests__/CoachContext.test.tsx` and verify everything builds cleanly (`npm run build`).