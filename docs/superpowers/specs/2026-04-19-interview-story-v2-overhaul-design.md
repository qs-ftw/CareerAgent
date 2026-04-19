# Design Spec: Interview Story Overhaul (IDE-style Diff & Logic Isolation)

## 1. Objective
Solve technical and UX critical issues in the Interview Story Bank:
1. **Logic Confusion**: Stop AI from conflating unrelated achievements (e.g., LangGraph vs Memory Optimization).
2. **Poor UI Visibility**: Current suggestion boxes are too small and don't highlight changes.
3. **Broken UX**: Fix non-functional buttons and improve the feedback loop.

## 2. Backend Logic Upgrades

### 2.1 Structured Context Injection
Modify `_get_achievements_context` in `backend/src/agent/nodes/story_consultant.py`:
- Fetch and group achievements by their parent `WorkExperience` or `Project`.
- Format output as:
    ```text
    ### [Work/Project Title]
    - Achievement: [Content] (ID: [UUID])
    ```

### 2.2 Prompt Hard Constraints
Update `CONSULTANT_SYSTEM_PROMPT` and `AUTOPILOT_SYSTEM_PROMPT`:
- Add explicit prohibition: "NEVER attribute metrics from Project A to Project B."
- Requirement: "When synthesizing multiple achievements, treat them as distinct career milestones, not a single physical project."

## 3. Frontend Interaction Redesign

### 3.1 Side-by-Side Diff View
- **Library**: Install `react-diff-viewer-continued`.
- **Mode Switching**: The main editor area in `StoryWorkspace.tsx` will have two states: `EDITING` and `DIFF`.
- **Comparison logic**: Use word-level diffing (`compareMethod="words"`) to highlight character-level changes.

### 3.2 "Accept/Reject" Workflow
1. User clicks "🔍 View Comparison" in chat.
2. Left pane switches to Diff View showing `Current Draft` vs `AI Suggestion`.
3. A "Comparison Toolbar" appears above the diff:
    - `[✅ Accept All]`: Overwrites draft with suggestion, saves, and returns to `EDITING` mode.
    - `[❌ Cancel]`: Discards comparison and returns to `EDITING` mode.

### 3.3 UX Fixes
- **Chat Bubbles**: Suggestion blocks will show a summary/motivation instead of full text to ensure readability.
- **Ignore Button**: Add a local state to hide/remove specific suggestion blocks in the chat UI.

## 4. Implementation Steps
1. **Backend**: Update achievement fetching and grouping logic.
2. **Backend**: Strengthen LLM prompt constraints.
3. **Frontend**: Install `react-diff-viewer-continued` and `diff`.
4. **Frontend**: Implement `DiffMode` logic in `StoryWorkspace.tsx`.
5. **Frontend**: Refactor `SuggestedChange` component with functioning buttons.
