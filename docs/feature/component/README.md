# Components

Updated: 2025-11-28

## Overview

React UI components organized by functional area.

## Module Index

| Module | Path | Description |
|--------|------|-------------|
| [Canvas](./canvas.md) | `components/canvas/` | Live2D, background, subtitle, WebSocket status |
| [Sidebar](./sidebar.md) | `components/sidebar/` | Chat history, settings, camera, screen capture |
| [Footer](./footer.md) | `components/footer/` | Input controls, mic, AI state indicator |
| [Electron](./electron.md) | `components/electron/` | Title bar, pet mode input |
| [UI](./ui.md) | `components/ui/` | Chakra UI wrappers |

## File Structure

```text
src/renderer/src/components/
├── canvas/          → canvas.md
├── sidebar/         → sidebar.md
├── footer/          → footer.md
├── electron/        → electron.md
└── ui/              → ui.md
```

## Quick Reference

### Canvas Components

- `Live2D` - Live2D model rendering
- `Background` - Background image/camera
- `Subtitle` - Animated subtitle
- `WsStatus` - Connection indicator

### Sidebar Components

- `Sidebar` - Main container
- `ChatHistoryPanel` - Message list
- `SettingUI` - Settings panels

### Footer Components

- `Footer` - Input controls container
- `AIStateIndicator` - State display

### Electron Components

- `TitleBar` - Window controls
- `PetModeInput` - Pet mode overlay

## Related Documents

- [Hooks](../hook/README.md)
- [Context](../context/README.md)
