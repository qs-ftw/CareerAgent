# Performance Coach Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build Phase 3 of the approved Performance Coach spec: the `个人 OKR` (Personal OKR) view. This involves managing personal objectives and key results mapped to capability growth and linking them to work context.

**Architecture:**
- **Backend:** 2 new SQLAlchemy models (`PersonalObjective`, `PersonalKeyResult`), new CRUD services, and endpoints in `src/api/coach.py`.
- **Frontend:** Implement the `个人 OKR` tab in the existing `/coach` workspace.

## File Structure

### Backend

- Create: `backend/src/models/personal_okr.py`
  - Defines `PersonalObjective` and `PersonalKeyResult`.
- Modify: `backend/src/models/__init__.py`
  - Export new models.
- Create: `backend/src/schemas/personal_okr.py`
  - Pydantic schemas.
- Create: `backend/src/services/personal_okr_service.py`
  - CRUD logic and weekly action suggestion generator (LLM-backed).
- Modify: `backend/src/api/coach.py`
  - Add routes for OKRs and weekly actions.
- Create: `backend/alembic/versions/20260420_02_add_personal_okrs.py`
  - Alembic migration.
- Create: `backend/tests/test_services/test_personal_okr_service.py`
- Create: `backend/tests/test_api/test_personal_okr_api.py`

### Frontend

- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/hooks/usePersonalOkr.ts`
- Create: `frontend/src/components/coach/PersonalOkrTab.tsx`
- Modify: `frontend/src/pages/PerformanceCoach.tsx`
  - Enable the OKR tab.
- Create: `frontend/src/components/coach/OkrList.tsx`
- Create: `frontend/src/components/coach/WeeklyActionList.tsx`

---

## Task 1: Data Models and Migrations

- [ ] Create `backend/src/models/personal_okr.py` with `PersonalObjective` and `PersonalKeyResult`.
- [ ] Export them in `backend/src/models/__init__.py`.
- [ ] Generate Alembic migration.

## Task 2: Backend Schemas and Services

- [ ] Create `backend/src/schemas/personal_okr.py`.
- [ ] Implement `backend/src/services/personal_okr_service.py`.
- [ ] Add `suggest_weekly_actions` logic using latest assessment + active OKRs + context state.

## Task 3: Backend API Endpoints

- [ ] Add OKR and weekly action endpoints to `backend/src/api/coach.py`.
- [ ] Verify with tests.

## Task 4: Frontend Integration

- [ ] Update types, API client, and hooks.
- [ ] Enable the "个人 OKR" tab in `PerformanceCoach.tsx`.
- [ ] Implement `PersonalOkrTab.tsx` and its sub-components.
- [ ] Verify build and tests.
