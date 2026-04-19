# Professional Knowledge Domain Interview Question Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a specialized module for managing single-version "hard skill" interview questions grouped into domains, and link these domains to specific resumes for targeted interview preparation.

**Architecture:** Create `KnowledgeDomain`, `KnowledgeQuestion`, and `ResumeDomainLink` models in the backend. Build REST APIs for CRUD operations and linking. On the frontend, build a Knowledge Hub (`/knowledge`), a Domain Detail page (`/knowledge/:id`), and integrate a domain-linking section into the existing Resume Detail page.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, React, Tailwind CSS, React Query.

---

### Task 1: Backend Models and Migration

**Files:**
- Create: `backend/src/models/knowledge.py`
- Modify: `backend/src/models/__init__.py`
- Modify: `backend/src/models/resume.py` (Add relationship if needed, though an association table is sufficient)
- Create: `backend/alembic/versions/YYYYMMDD_XX_add_knowledge_domain_tables.py`

- [ ] **Step 1: Create Knowledge Models**
  Create `backend/src/models/knowledge.py` with `KnowledgeDomain`, `KnowledgeQuestion`, and `ResumeDomainLink` models. Ensure they inherit from `CommonBase`.
  ```python
  import uuid
  from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
  from sqlalchemy.dialects.postgresql import JSONB, UUID
  from sqlalchemy.orm import Mapped, mapped_column

  from src.models.base import CommonBase

  class KnowledgeDomain(CommonBase):
      __tablename__ = "knowledge_domains"
      workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True)
      user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
      name: Mapped[str] = mapped_column(String(255), nullable=False)
      tags_json: Mapped[list] = mapped_column(JSONB, nullable=True, default=list)

  class KnowledgeQuestion(CommonBase):
      __tablename__ = "knowledge_questions"
      workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True)
      user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
      domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_domains.id", ondelete="CASCADE"), nullable=False, index=True)
      question_text: Mapped[str] = mapped_column(Text, nullable=False)
      answer_markdown: Mapped[str | None] = mapped_column(Text, nullable=True, default="")
      is_pinned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
      sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

  class ResumeDomainLink(CommonBase):
      __tablename__ = "resume_domain_links"
      workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True)
      user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
      resume_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
      domain_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_domains.id", ondelete="CASCADE"), nullable=False, index=True)
  ```

- [ ] **Step 2: Update Model Init**
  Add `from .knowledge import KnowledgeDomain, KnowledgeQuestion, ResumeDomainLink` to `backend/src/models/__init__.py`.

- [ ] **Step 3: Generate Migration**
  Run `cd backend && alembic revision --autogenerate -m "add knowledge domain tables"`.
  Review the generated migration script to ensure the tables and foreign keys are correct.

- [ ] **Step 4: Apply Migration**
  Run `cd backend && alembic upgrade head`.

- [ ] **Step 5: Commit**
  ```bash
  git add backend/src/models/ backend/alembic/versions/
  git commit -m "feat: add models for knowledge domains and questions"
  ```

### Task 2: Backend Schemas and Service

**Files:**
- Create: `backend/src/schemas/knowledge.py`
- Create: `backend/src/services/knowledge_service.py`

- [ ] **Step 1: Create Schemas**
  Create `backend/src/schemas/knowledge.py` with Pydantic models:
  - `KnowledgeDomainCreate` (name, tags_json)
  - `KnowledgeDomainUpdate`
  - `KnowledgeDomainResponse` (id, name, tags_json, question_count)
  - `KnowledgeQuestionCreate` (question_text, answer_markdown)
  - `KnowledgeQuestionUpdate` (answer_markdown, is_pinned, sort_order)
  - `KnowledgeQuestionResponse` (id, domain_id, question_text, answer_markdown, is_pinned, sort_order)
  - `ResumeDomainLinkRequest` (domain_ids: list[UUID])

- [ ] **Step 2: Implement Knowledge Service**
  Create `backend/src/services/knowledge_service.py`. Implement functions:
  - `list_domains(session, user_id, resume_id=None)`: Returns domains, filtering by `resume_id` if provided via the `ResumeDomainLink` table. Include a count of questions.
  - `create_domain`, `update_domain`, `delete_domain`.
  - `list_questions(session, user_id, domain_id)`: Returns questions ordered by `is_pinned` DESC, `sort_order` ASC.
  - `create_question`, `update_question`, `delete_question`.
  - `link_domains_to_resume(session, user_id, workspace_id, resume_id, domain_ids)`: Clears existing links for the resume and inserts new ones based on the provided list of IDs.
  - `get_linked_domains_for_resume(session, user_id, resume_id)`: Returns a list of `domain_id`s currently linked to a resume.

- [ ] **Step 3: Commit**
  ```bash
  git add backend/src/schemas/knowledge.py backend/src/services/knowledge_service.py
  git commit -m "feat: add knowledge service and schemas"
  ```

### Task 3: Backend API Endpoints

**Files:**
- Create: `backend/src/api/knowledge.py`
- Modify: `backend/src/api/router.py`

- [ ] **Step 1: Implement Knowledge API Routes**
  Create `backend/src/api/knowledge.py`. Define the following routes using the service functions:
  - `GET /knowledge/domains` (accepts optional `resume_id` query param)
  - `POST /knowledge/domains`
  - `PATCH /knowledge/domains/{domain_id}`
  - `DELETE /knowledge/domains/{domain_id}`
  - `GET /knowledge/domains/{domain_id}/questions`
  - `POST /knowledge/domains/{domain_id}/questions`
  - `PATCH /knowledge/questions/{question_id}`
  - `DELETE /knowledge/questions/{question_id}`
  - `GET /resumes/{resume_id}/domains` (List of linked domain IDs)
  - `POST /resumes/{resume_id}/domains` (Update linked domains)

- [ ] **Step 2: Register Router**
  In `backend/src/api/router.py`, import the `knowledge` router and include it: `api_router.include_router(knowledge.router)` (and potentially add the resume-domain endpoints to the existing `resumes` router or keep them in knowledge but mapped to `/api/knowledge/resumes/...` for simplicity). Let's put the resume linking endpoints in `knowledge.py` under the prefix `/knowledge/resumes`.

- [ ] **Step 3: Commit**
  ```bash
  git add backend/src/api/
  git commit -m "feat: add knowledge API endpoints"
  ```

### Task 4: Frontend Types and Hooks

**Files:**
- Modify: `frontend/src/types/index.ts`
- Create: `frontend/src/hooks/useKnowledge.ts`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Define Frontend Types**
  Add `KnowledgeDomain`, `KnowledgeQuestion` interfaces to `frontend/src/types/index.ts` matching the backend schemas.

- [ ] **Step 2: Update API Client**
  Add `knowledgeApi` to `frontend/src/lib/api.ts` for all the new endpoints defined in Task 3.

- [ ] **Step 3: Implement React Query Hooks**
  Create `frontend/src/hooks/useKnowledge.ts` providing standard queries and mutations:
  - `useDomains(resumeId?: string)`
  - `useCreateDomain()`, `useUpdateDomain()`, `useDeleteDomain()`
  - `useQuestions(domainId: string)`
  - `useCreateQuestion()`, `useUpdateQuestion()`, `useDeleteQuestion()`
  - `useResumeDomains(resumeId: string)` (fetch linked IDs)
  - `useLinkResumeDomains()` (mutation to save linked IDs)

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/types/ frontend/src/lib/ frontend/src/hooks/
  git commit -m "feat: add frontend hooks and types for knowledge domain"
  ```

### Task 5: Frontend UI - Knowledge Base Hub & Detail Pages

**Files:**
- Create: `frontend/src/pages/KnowledgeBank.tsx`
- Create: `frontend/src/pages/KnowledgeDetail.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update Routing and Navigation**
  Add `/knowledge` (mapping to `KnowledgeBank`) and `/knowledge/:id` (mapping to `KnowledgeDetail`) to `frontend/src/App.tsx`. Add a "专业知识库" link to `Sidebar.tsx`.

- [ ] **Step 2: Build KnowledgeBank Component**
  Implement `frontend/src/pages/KnowledgeBank.tsx`.
  - Header with a "Create Domain" button.
  - A toolbar with a search input, tag filters (preset chips + custom), and a "Resume Context" dropdown (using `useListResumes`).
  - A responsive grid displaying `KnowledgeDomain` cards. Each card shows the name, tags as `notion-pill`s, and routes to `/knowledge/:id` on click.
  - Integrate domain creation modal.

- [ ] **Step 3: Build KnowledgeDetail Component (Accordion)**
  Implement `frontend/src/pages/KnowledgeDetail.tsx`.
  - Header showing domain name and tags.
  - "Add Question" button.
  - List of questions grouped by `is_pinned` status.
  - For each question: display title, "Pin/Unpin" toggle, "Delete" button.
  - **Accordion Interaction**: Clicking a question row expands it to reveal a `textarea` for the `answer_markdown`. Add a "Save" button inside the expanded area to trigger `updateQuestion`.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/pages/ frontend/src/App.tsx frontend/src/components/layout/Sidebar.tsx
  git commit -m "feat: implement knowledge bank and domain detail pages"
  ```

### Task 6: Resume Detail Integration

**Files:**
- Modify: `frontend/src/pages/ResumeDetail.tsx`

- [ ] **Step 1: Add "Required Domains" Section**
  In `ResumeDetail.tsx`, below the Interview Prep section, add a new section "专业知识领域 (Required Domains)".
  - Use `useResumeDomains(resume.id)` to fetch currently linked domain IDs.
  - Display the linked domains as clickable cards/pills that navigate to `/knowledge/:id`.

- [ ] **Step 2: Implement "Link Domains" Modal**
  - Add an "Edit Domains" button to the section header.
  - Clicking it opens a modal containing a multi-select list or checklist of all available `KnowledgeDomain`s (fetched via `useDomains()`).
  - The modal allows checking/unchecking domains.
  - On save, use `useLinkResumeDomains` mutation to push the updated array of IDs to the backend.

- [ ] **Step 3: Verify and Commit**
  Run `npm run build` to ensure no frontend TypeScript errors.
  ```bash
  git add frontend/src/pages/ResumeDetail.tsx
  git commit -m "feat: integrate knowledge domain linking into resume detail"
  ```
