# Performance Coach Phase 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build Phase 4 of the approved Performance Coach spec: the `周报复盘` (Weekly Review) view. This involves generating manager-ready weekly reports, self-reflections, and triggering incremental capability re-rating.

**Architecture:**
- **Backend:** 1 new SQLAlchemy model (`WeeklyReviewRun`), new service for report generation and re-rating, and endpoints in `src/api/coach.py`.
- **Frontend:** Implement the `周报复盘` tab in the existing `/coach` workspace.

## File Structure

### Backend

- Create: `backend/src/models/weekly_review.py`
  - Defines `WeeklyReviewRun`.
- Modify: `backend/src/models/__init__.py`
  - Export new model.
- Create: `backend/src/schemas/weekly_review.py`
  - Pydantic schemas.
- Create: `backend/src/services/weekly_review_service.py`
  - Logic to aggregate weekly progress, generate report via LLM, and trigger re-assessment.
- Modify: `backend/src/api/coach.py`
  - Add routes for weekly reviews.
- Create: `backend/alembic/versions/20260420_03_add_weekly_reviews.py`
  - Alembic migration.
- Create: `backend/tests/test_services/test_weekly_review_service.py`
- Create: `backend/tests/test_api/test_weekly_review_api.py`

### Frontend

- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/hooks/useWeeklyReview.ts`
- Create: `frontend/src/components/coach/WeeklyReviewTab.tsx`
- Modify: `frontend/src/pages/PerformanceCoach.tsx`
  - Enable the Weekly Review tab.
- Create: `frontend/src/components/coach/WeeklyReportViewer.tsx`
- Create: `frontend/src/components/coach/SelfReflectionEditor.tsx`

---

## Task 1: Data Models and Migrations

- [x] Create `backend/src/models/weekly_review.py`.
- [x] Export in `backend/src/models/__init__.py`.
- [x] Generate Alembic migration.

## Task 2: Backend Schemas and Services

- [x] Create `backend/src/schemas/weekly_review.py`.
- [x] Implement `backend/src/services/weekly_review_service.py`.
  - Logic to generate `manager_report` from current week's `PerformanceProgressEntry` items.
  - Logic to trigger a new `CapabilityAssessmentSnapshot` (incremental re-rating).

## Task 3: Backend API Endpoints

- [x] Add weekly review endpoints to `backend/src/api/coach.py`.
- [x] Verify with tests.

## Task 4: Frontend Integration

- [x] Update types, API client, and hooks.
- [x] Enable the "周报复盘" tab in `PerformanceCoach.tsx`.
- [x] Implement `WeeklyReviewTab.tsx` and its sub-components.
- [x] Verify build and tests.
