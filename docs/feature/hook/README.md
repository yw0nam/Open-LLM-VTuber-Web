# Custom Hooks

Updated: 2025-11-28

## Overview

React hooks organized by functional area.

## Module Index

| Module | Path | Description |
|--------|------|-------------|
| [Canvas](./canvas.md) | `hooks/canvas/` | Live2D model, resize, expression, subtitle |
| [Footer](./footer.md) | `hooks/footer/` | Input, mic toggle, interrupt |
| [Sidebar](./sidebar.md) | `hooks/sidebar/` | Sidebar state, chat history, settings |
| [Utils](./utils.md) | `hooks/utils/` | Audio, interrupt, storage, IPC handlers |
| [Electron](./electron.md) | `hooks/electron/` | Pet drag, pet input |

## File Structure

```text
src/renderer/src/hooks/
├── canvas/          → canvas.md
├── footer/          → footer.md
├── sidebar/         → sidebar.md
├── utils/           → utils.md
└── electron/        → electron.md
```

## Quick Reference

### Canvas Hooks

- `useLive2DModel` - Model loading and interactions
- `useLive2DResize` - Canvas resizing
- `useLive2DExpression` - Expression control
- `useSubtitleDisplay` - Subtitle animation

### Footer Hooks

- `useFooter` - Combined footer logic

### Sidebar Hooks

- `useSidebar` - Sidebar state
- `useChatHistory` - Message loading
- `useCameraPanel` - Camera controls

### Utility Hooks

- `useAudioTask` - Audio playback with lip sync
- `useInterrupt` - Conversation interruption
- `useLocalStorage` - Storage persistence
- `useIpcHandlers` - Electron IPC

### Electron Hooks

- `usePetDrag` - Window dragging
- `usePetInput` - Floating input

## Related Documents

- [Components](../component/README.md)
- [Context](../context/README.md)

