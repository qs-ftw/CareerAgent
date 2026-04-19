# Interview Story Bank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dynamic "Interview Story Bank" where users can draft answers to common interview questions with AI guidance and achievement-linking capabilities.

**Architecture:** Enhancing the existing `InterviewStory` model to store free-form Markdown answers and chat history. A new "Consultant" agent node will handle interactive feedback and achievement matching.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL (JSONB), React, Tailwind CSS, LangGraph.

---

### Task 1: Backend Model & Schema Overhaul

**Files:**
- Modify: `backend/src/models/story.py`
- Modify: `backend/src/schemas/story.py`
- Create: `backend/alembic/versions/20260418_01_enhance_interview_story.py` (Migration)

- [ ] **Step 1: Update the `InterviewStory` model**
  Update `backend/src/models/story.py` to support free-form answers and chat history.
- [ ] **Step 2: Update Pydantic Schemas**
  Modify `backend/src/schemas/story.py` to reflect model changes.
- [ ] **Step 3: Create and run migration**
  Run: `cd backend && alembic revision --autogenerate -m "enhance interview story"`
- [ ] **Step 4: Commit**
  ```bash
  git add backend/src/models/story.py backend/src/schemas/story.py
  git commit -m "feat: enhance InterviewStory model and schema"
  ```

### Task 2: Service & API Updates

**Files:**
- Modify: `backend/src/services/story_service.py`
- Modify: `backend/src/api/stories.py`

- [ ] **Step 1: Implement Question Library Seeding**
  In `backend/src/services/story_service.py`, add a function to seed default questions if the bank is empty.
- [ ] **Step 2: Update `list_stories` to support seeding**
  Modify `list_stories` to call the seeding function if no stories exist.
- [ ] **Step 3: Implement `batch_import` API**
  Add `POST /stories/batch-import` in `backend/src/api/stories.py`.
- [ ] **Step 4: Commit**
  ```bash
  git add backend/src/services/story_service.py backend/src/api/stories.py
  git commit -m "feat: implement story seeding and batch import API"
  ```

### Task 3: AI Consultant Prompt & Node

**Files:**
- Create: `backend/src/prompts/story_consultant.py`
- Create: `backend/src/agent/nodes/story_consultant.py`

- [ ] **Step 1: Write the Consultant System Prompt**
  Define instructions for AI to identify "Achievement Hooks" and suggest metrics.
- [ ] **Step 2: Implement the Consultant Node**
  Create logic to retrieve user achievements and generate interactive feedback.
- [ ] **Step 3: Implement Autopilot Logic**
  Add generation logic to create a complete draft from relevant achievements.
- [ ] **Step 4: Commit**
  ```bash
  git add backend/src/prompts/story_consultant.py backend/src/agent/nodes/story_consultant.py
  git commit -m "feat: add AI Consultant prompt and agent node"
  ```

### Task 4: Frontend Workspace Development

**Files:**
- Modify: `frontend/src/pages/StoryBank.tsx`
- Create: `frontend/src/pages/StoryWorkspace.tsx`
- Modify: `frontend/src/App.tsx` (Route)

- [ ] **Step 1: Redesign `StoryBank.tsx` Index**
  Update the gallery view to show cards with categories and progress status.
- [ ] **Step 2: Implement `StoryWorkspace.tsx`**
  Add Markdown editor and AI Consultant chat sidebar.
- [ ] **Step 3: Hook up `useStories` and new API calls**
  Implement synchronization between the workspace and the backend.
- [ ] **Step 4: Final Verification**
  Run build and check for linting errors.
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/
  git commit -m "feat: complete Story Bank and Workspace UI"
  ```
