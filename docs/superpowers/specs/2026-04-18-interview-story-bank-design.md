# Design Spec: Interview Story Bank

## 1. Objective
Implement a dynamic "Interview Story Bank" that helps users prepare for macro-level interview questions by synthesizing their existing "Achievements" into high-quality narrative answers. The system provides both fully automated (Autopilot) and collaborative (Interactive) drafting modes.

## 2. Data Architecture

### 2.1 Backend Models
- **`InterviewStory` (Modified)**:
    - `id`: UUID (Primary Key)
    - `workspace_id`: UUID (Foreign Key)
    - `user_id`: UUID (Foreign Key)
    - `question_text`: Text (The interview question)
    - `answer_markdown`: Text (The current draft of the answer)
    - `theme`: String (e.g., "Leadership", "Conflict", "Technical")
    - `status`: Enum (`empty`, `drafting`, `finalized`)
    - `linked_achievement_ids`: JSONB/Array (List of UUIDs of referenced achievements)
    - `analysis_chat`: JSONB (Conversation history with the AI Consultant)
    - `star_summary`: JSONB (AI-extracted Situation, Task, Action, Result for quick review)

### 2.2 Relationship
- **1:N with Achievements**: An `InterviewStory` can reference multiple `Achievements`. This relationship is used by the AI to pull context and by the user to track which "proof points" they've used.

## 3. Core Features

### 3.1 Library Management
- **Pre-seeded Questions**: ~20 common behavioral and technical questions (e.g., "Tell me about a time you failed") are automatically created when a user first enters the bank.
- **Import/Add**:
    - **Single**: Add a custom question via a simple modal.
    - **Batch**: Paste a list of questions; AI parses and creates shell entries.

### 3.2 AI Consultant (Interactive Mode)
- **Context Injection**: The model is provided with the full text of all user Achievements.
- **Achievement Matching**: As the user drafts, the AI performs semantic search to identify relevant achievements.
- **Narrative Hooks**: Instead of generic advice, the AI suggests specific metric-backed details from the user's career (e.g., "You should mention your 20% cost reduction from the 'Cloud Migration' project here").
- **Direct Editing**: If the AI proposes a better phrasing or metric integration, the user can click "Apply" to update their Markdown editor immediately.

### 3.3 Autopilot Mode
- **Generation**: AI selects the 1-3 most relevant achievements for a specific question and generates a complete STAR-structured narrative.
- **Refinement**: User then enters Interactive mode to polish the generated draft.

## 4. UI/UX Design (Notion-Inspired)

### 4.1 Gallery View (Index)
- A grid/list of cards showing the Question, Category, and a completion status indicator.
- Tabs for filtering by category (Introduction, Behavioral, Leadership, etc.).

### 4.2 Workspace (Detail View)
- **Left/Center Pane**: A clean Markdown editor for the answer.
- **Right Sidebar**: The "Consultant" chat interface.
    - Floating "Achievement Chips" representing linked proof points.
    - Chat message blocks with "Accept Changes" buttons for direct editing.
- **Header**: Status selector and "Generate with Autopilot" button.

## 5. API Endpoints
- `GET /stories`: List all questions/stories.
- `POST /stories/batch-import`: Create multiple empty stories from a list of questions.
- `GET /stories/{id}`: Get story details + chat history.
- `POST /stories/{id}/consult`: Send a user message or draft snippet to the AI for feedback/achievement suggestions.
- `POST /stories/{id}/autopilot`: Trigger full draft generation.
- `PATCH /stories/{id}`: Update Markdown content or status.

## 6. Implementation Notes
- Use a dedicated "Consultant" prompt that emphasizes "proof-based storytelling" over generic career advice.
- Ensure the Markdown editor supports real-time updates when the AI's suggestions are accepted.
