# Incompatible Features

This document lists features that are currently in the codebase but are not defined in Task Master and may need to be removed or re-evaluated.

## Group Feature

There is a "group" feature that allows for group chats. This feature is not defined in the current Task Master tasks.

**Files and code related to this feature:**

*   `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-service.tsx`: The `members` and `is_owner` fields in the `MessageEvent` interface.
*   `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-handler.tsx`: The `group-update` case in the `handleWebSocketMessage` function and the `useGroup` hook.
*   `Open-LLM-VTuber-Web/src/renderer/src/context/group-context.tsx`: The context for managing group state.
*   `Open-LLM-VTuber-Web/src/renderer/src/components/sidebar/group-drawer.tsx`: The UI component for the group drawer.

**Recommendation:**

Remove this feature unless it is decided to be part of the project scope.

## Browser View Feature

There is a "browser view" feature that seems to be related to displaying web pages within the application. This feature is not defined in the current Task Master tasks.

**Files and code related to this feature:**

*   `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-service.tsx`: The `browser_view` field in the `MessageEvent` interface.

**Recommendation:**

Remove this feature unless it is decided to be part of the project scope.

## Unused `uids` Field

The `uids` field in the `MessageEvent` interface in `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-service.tsx` is not used anywhere in the codebase.

**Recommendation:**

Remove this field to clean up the code.

## Unused `forwarded` Field

The `forwarded` field in the `MessageEvent` interface in `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-service.tsx` is not used anywhere in the codebase.

**Recommendation:**

Remove this field to clean up the code.
