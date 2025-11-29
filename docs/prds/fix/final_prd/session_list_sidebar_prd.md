# Session List Sidebar Enhancement PRD

## 1. Core Guide

### 1.1. Overview

- **Goal:** Enhance the existing `HistoryDrawer` to provide robust session management, specifically adding **Session ID visibility**, **copy functionality**, and **deletion safety**.
- **Context:** The current sidebar displays sessions with message previews. This update shifts focus to technical session identification and safe management.
- **Non-Goal:**
  - Advanced search/filtering.
  - Session grouping.
  - Real-time sync across multiple clients.

### 1.2. Detailed Requirements

#### Functional Requirements
- **Session ID Display:**
  - Replace or augment the message preview with the **Session ID**.
  - Display format: Truncated UUID (e.g., `a1b2c3d4...`) to save space. `[Must-have]`
- **Full ID Tooltip:** Hovering over the truncated ID must show the full UUID. `[Must-have]`
- **Copy ID:** Provide a quick way (icon/button) to copy the full Session ID to the clipboard. `[Should-have]`
- **Delete Confirmation:**
  - The delete action must trigger a **confirmation dialog** (native `confirm` or UI modal) before executing. `[Must-have]`
  - Currently, deletion is immediate; this must be fixed to prevent accidents.
- **Session Selection & State:**
  - Clicking a session loads it via `stmAPI.getChatHistory`. (Existing functionality to be preserved).
  - The active session must remain highlighted.

#### Non-Functional Requirements
- **UX Safety:** Critical actions (delete) must require user confirmation. `[Must-have]`
- **Visual Hierarchy:** The Session ID should be distinct (e.g., monospace font) from other text. `[Should-have]`
- **Performance:** Tooltips and copy actions should be instantaneous. `[Must-have]`

### 1.3. Implementation Plan

#### Step 1: Update List Item UI (ID & Tooltip)

**Objective:** Render Session IDs with truncation and tooltips in `HistoryDrawer`.

**Implementation:**
1.  Modify `HistoryItem` component in `history-drawer.tsx`.
2.  Add a tooltip component (from UI library or native `title` attribute if simple).
3.  Render the `session_id` (truncated) in a monospace font.
4.  **Verification:** Hovering the ID shows the full string.

**Files to Modify:**
- `src/renderer/src/components/sidebar/history-drawer.tsx`
- `src/renderer/src/components/sidebar/sidebar-styles.ts` (if styles are separated)

#### Step 2: Implement "Copy ID" Feature

**Objective:** Allow users to copy the Session ID.

**Implementation:**
1.  Add a small "Copy" icon button next to the Session ID.
2.  On click, write the full `session_id` to `navigator.clipboard`.
3.  Show a temporary "Copied!" tooltip or toast feedback.
4.  **Verification:** Clicking the icon puts the UUID in the clipboard.

#### Step 3: Add Delete Confirmation

**Objective:** Prevent accidental deletions.

**Implementation:**
1.  Intercept the `onDelete` handler in `HistoryDrawer` or `HistoryItem`.
2.  Show a confirmation dialog ("Are you sure you want to delete this session? This cannot be undone.").
3.  Only proceed with `deleteHistory` if confirmed.
4.  **Verification:** Clicking delete prompts the user; cancelling does nothing; confirming removes the session.

---

## 2. Appendix (Reference)

### A. Data Flow

```
User clicks Copy -> Write to Clipboard -> Show Feedback
User clicks Delete -> Show Confirmation -> (If Yes) -> Call API -> Remove from List
```

[list_session](./../../../data_flow/session/LIST_SESSIONS.md)
[delete_session](./../../../data_flow/session/DELETE_SESSION.md)

### B. API References

-  `stmAPI.listSessions`
- `stmAPI.deleteSession` 
- `stmAPI.getChatHistory`

[api_docs](../../../feature/service/api-service.md)

---

## 3. Virtual FGI Reflection & Intent Notes

### 3.1. Why Session IDs instead of just Titles?
- **Critique (Designer):** "IDs are ugly. Why show them?"
- **Intent:** In this LLM-VTuber context, users often debug specific conversation branches or manage distinct "memories". The unique Session ID is the only immutable reference. While "Title" is nice, we currently lack a robust auto-titling feature, so the ID is the fallback truth.
- **Decision:** Display truncated ID. Titles can be added later as an enhancement.

### 3.2. Why Confirmation on Delete?
- **Critique (Dev):** "It slows down the user."
- **Intent:** Chat history is often valuable training data or context. Accidental deletion is irreversible (per backend API). Safety > Speed here.
- **Decision:** Mandatory confirmation.

### 3.3. Implementation Scope
- **Critique (PM):** "Are we rebuilding the drawer?"
- **Intent:** No. We are strictly *modifying* the `HistoryItem` render logic and the delete handler. The data fetching logic (`useHistoryDrawer`) remains untouched.
- **Decision:** Keep changes localized to `history-drawer.tsx` presentation layer.

