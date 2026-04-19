# Design Spec: Resume-Centric Interview Story Integration

## 1. Objective
Transform the Interview Story Bank into a resume-aware preparation system. Ensure interview answers are strictly based on the content of a specific resume version, preventing out-of-context achievement linking. Implement multi-versioning for stories per resume.

## 2. Data Architecture

### 2.1 Model Changes
- **`InterviewStory` (Question Bank)**:
    - Acts as a template repository for common/custom questions.
    - Cleanup: Deduplicate English questions, translate to Chinese.
    - Tag Management: Map `behavioral` to `general`.
- **`ResumeInterviewAnswer` (New Model)**:
    - `id`: UUID (PK)
    - `story_id`: UUID (FK to InterviewStory)
    - `resume_id`: UUID (FK to Resumes, nullable for global draft)
    - `answer_markdown`: Text (The versioned answer)
    - `analysis_chat`: JSONB (Versioned chat history)
    - `status`: Enum (`empty`, `drafting`, `finalized`)
    - `linked_achievement_ids`: JSONB (Achievements used from the linked resume)

### 2.2 Data Integrity
- Ensure unique constraint on `(story_id, resume_id)` to allow only one answer version per question per resume.

## 3. Core Features

### 3.1 AI "Resume Sandbox" Mode
- **Scope**: When answering in the context of a resume, the AI context is limited to `ResumeVersion.content_json`.
- **Context Extraction**:
    - Extract `projects`, `experiences`, and `highlights` from the selected resume.
    - Inject these into the LLM prompt as the ONLY available source of truth.
- **Outcome**: The AI-generated answer will never reference a project or metric that isn't already visible on that specific resume.

### 3.2 UI/UX Enhancements

#### A. Story Bank (Index)
- **Resume Filter**: Add a dropdown to filter questions by resume association.
- **Status Indicators**: Show which questions are "Ready" for which resume.

#### B. Story Workspace (Detail)
- **Context Switcher**: A header component allowing users to switch between "Global" and specific resumes.
- **Dynamic Loading**: Switching the resume instantly loads the corresponding `ResumeInterviewAnswer` content and chat history.
- **Real-time Sync**: Saves are scoped to the active resume context.

#### C. Resume Detail Page
- **Interview Prep Section**: A new section displaying recommended interview questions based on the resume's target role.
- **In-place Editing**: Allow users to trigger the AI Consultant directly from the resume view.

## 4. Implementation Steps

### Phase 1: Data Migration & Cleanup
1. Backend: Scan `interview_stories` table.
2. Remove duplicate English entries; translate missing Chinese equivalents.
3. Consolidate `behavioral` tags to `general`.
4. Create `resume_interview_answers` table and migrate existing data.

### Phase 2: Backend API & AI Logic
1. Implement `GET /resumes/{id}/stories` and `POST /stories/{id}/answers`.
2. Update `story_consultant` and `story_autopilot` nodes to accept an optional `resume_id`.
3. Implement resume context extraction for the LLM sandbox.

### Phase 3: Frontend Overhaul
1. Update `StoryBank.tsx` with filters.
2. Update `StoryWorkspace.tsx` with the context switcher.
3. Enhance `ResumeDetail.tsx` with the Interview Prep section.
