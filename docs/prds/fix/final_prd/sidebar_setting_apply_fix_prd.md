# Sidebar Setting Application Logic Fix PRD

## 1. Core Guide (Within 200 lines, for immediate action)

### 1.1. Overview

- **Goal:** **"Edit Locally, Commit Globally."** Unify all sidebar settings (General, Live2D, ASR, TTS, Agent) to use a deferred application model. Changes must **only** persist and affect the app when "Save" is clicked.
- **Non-Goal:** Visual redesign; Backend API changes; "About" tab logic (informational only).

### 1.2. Core Requirements

- **[Must-have]** **Deferred Application:** UI components must bind to a local `useState` (staging). Global `Context` or `localStorage` **must not** update during editing.
- **[Must-have]** **Commit on Save:** The `handleSave` callback is the **exclusive** trigger for updating Global Contexts and `localStorage`.
- **[Must-have]** **Revert on Cancel:** "Cancel" or closing the drawer resets the UI to the last saved state (`originalSettings`).
- **[Must-have]** **State Synchronization:** Upon a successful "Save", the local `originalSettings` must be updated to match the new committed state, ensuring subsequent cancels revert to this new baseline.
- **[Must-have]** **Unified Orchestration:** `SettingUI` must pass `onSave` and `onCancel` to **all** child tabs, specifically fixing the disconnected `TTS` component.

### 1.3. Implementation Plan

1.  **Fix `SettingUI.tsx`:**
    -   Pass `onSave={handleSaveCallback}` and `onCancel={handleCancelCallback}` to the `TTS` component.

2.  **Refactor Hooks (`use-general`, `use-live2d`, `use-asr`, `use-tts`):**
    -   **Pattern:**
        ```typescript
        const [settings, setSettings] = useState(initialGlobalState);
        const [original, setOriginal] = useState(initialGlobalState);
        // ...
        const handleSave = () => {
           updateGlobalState(settings); // Context/LocalStorage
           setOriginal(settings);       // Update baseline
        };
        const handleCancel = () => {
           setSettings(original);       // Revert
        };
        ```
    -   **Action:** Remove all `useEffect` blocks that watch `settings` and trigger side effects.

3.  **Verify `use-agent-settings.ts`:**
    -   Confirm it already follows the pattern or refactor to match `setOriginal` logic on save.

## 2. Appendix (Detailed Reference)

### Step 1. Context & Legacy Analysis

-   **Current State:** `SettingUI` orchestrates save/cancel via callback registration.
-   **Problem:** `TTS` is disconnected. Most hooks (`General`, `Live2D`) eagerly update global state via `useEffect`, making the "Save" button redundant and "Cancel" impossible.
-   **Scope:** All interactive tabs. The "About" tab is static and requires no changes.

### Step 2. Requirements Definition (Detailed)

| ID | Requirement | Priority | Description |
| :--- | :--- | :--- | :--- |
| REQ-1 | Remove Reactive Side-Effects | [Must-have] | Eliminate `useEffect(() => { saveToStorage() }, [settings])`. |
| REQ-2 | Centralize Save Logic | [Must-have] | All persistence/context updates happen **only** in `handleSave`. |
| REQ-3 | Connect TTS Component | [Must-have] | Pass `onSave`/`onCancel` props in `SettingUI`. |
| REQ-4 | Baseline Update | [Must-have] | Update `originalSettings` after a successful save to support multiple edit-save cycles. |

### Step 3. UX Flow Design

1.  **Open:** UI loads values from Global State -> Local Staging.
2.  **Edit:** User modifies values. UI reflects changes immediately. **App (Background/Model) does not change.**
3.  **Save:**
    -   Global State updates (App changes).
    -   Local Staging becomes the new Baseline.
    -   Drawer closes.
4.  **Cancel:**
    -   Local Staging reverts to Baseline.
    -   UI updates to show original values.
    -   Drawer closes.

### Step 4. Technical Dependencies

-   **Frontend State:** `src/contexts/*`, `localStorage`.

### Step 5. Implementation Plan Structure

-   **Phase 1: Orchestration** (Fix `SettingUI` props).
-   **Phase 2: Refactoring** (Convert all hooks to Deferred Pattern).
-   **Phase 3: QA** (Verify "No immediate change" and "Reset on Cancel").

### Step 6. Risk Analysis

-   **Risk:** Stale Closures.
    -   *Mitigation:* Use `useCallback` with proper dependencies for `handleSave`.
-   **Risk:** Deep Object State.
    -   *Mitigation:* Ensure spread operators (`...prev`) are used correctly for nested setting updates.

### Step 7. Test Scenarios

**TC-1: General - Background Deferred**
1.  Change BG URL. Verify BG **stays same**.
2.  Save. Verify BG **updates**.

**TC-2: Cancel Revert**
1.  Change Model. Verify Model **stays same**.
2.  Cancel. Re-open. Verify Model is **original**.

**TC-3: TTS Persistence**
1.  Change Voice. Reload without saving. Verify change **lost**.
2.  Change Voice. Save. Reload. Verify change **kept**.

## Virtual FGI Reflection & Intent Notes

-   **Developer Critique:** *"The document was too long."* -> **Action:** Condensed the "Core Guide" to be strictly actionable. Moved detailed breakdowns to the Appendix.
-   **PM Critique:** *"Does context reset correctly?"* -> **Action:** Added specific requirement for updating `originalSettings` (Baseline) upon Save. This ensures that if we ever keep the drawer open after save (future requirement), the cancel logic still holds.
-   **UX Critique:** *"User needs to know what's pending."* -> **Intent:** The UI *will* show the new values (e.g., the text input changes), but the *effect* (the actual background image on screen) waits. This is standard "modal" behavior.
-   **Missing Scope:** *"What about About tab?"* -> **Action:** Explicitly marked "About" as out-of-scope/non-goal to prevent confusion.
