# Preload Scripts

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Secure bridge between Electron main and renderer processes via context isolation
- **I/O**: Renderer calls `window.api.*` → IPC messages → Main process handlers

## 2. Core Logic

### Exposed APIs (`window.api`)

| Method | Direction | Description |
|--------|-----------|-------------|
| `setIgnoreMouseEvents(ignore)` | R→M | Enable/disable mouse passthrough |
| `toggleForceIgnoreMouse()` | R→M | Toggle force mouse passthrough |
| `showContextMenu()` | R→M | Display right-click context menu |
| `setMode(mode)` | R→M | Request mode change (`"window"` / `"pet"`) |
| `updateComponentHover(id, isHovering)` | R→M | Report component hover state |
| `getConfigFiles()` | R→M | Get available character configs |
| `updateConfigFiles(files)` | R→M | Update character config list |

### Event Listeners (`window.api.on*`)

| Method | Event | Callback Signature |
|--------|-------|-------------------|
| `onModeChanged(cb)` | `mode-changed` | `(mode: "window" \| "pet") => void` |
| `onForceIgnoreMouseChanged(cb)` | `force-ignore-mouse-changed` | `(isForced: boolean) => void` |
| `onMicToggle(cb)` | `mic-toggle` | `() => void` |
| `onInterrupt(cb)` | `interrupt` | `() => void` |
| `onToggleInputSubtitle(cb)` | `toggle-input-subtitle` | `() => void` |
| `onToggleScrollToResize(cb)` | `toggle-scroll-to-resize` | `() => void` |
| `onSwitchCharacter(cb)` | `switch-character` | `(filename: string) => void` |

All `on*` methods return an unsubscribe function.

### Extended Electron APIs (`window.electron`)

| Property | Description |
|----------|-------------|
| `ipcRenderer.invoke(channel, ...args)` | Async IPC call |
| `ipcRenderer.send(channel, ...args)` | Fire-and-forget IPC |
| `ipcRenderer.on/once/removeListener` | IPC event handling |
| `desktopCapturer.getSources(options)` | Screen capture sources |
| `process.platform` | OS platform string |

### Constraints

- Context isolation enabled (`contextIsolation: true`)
- Only whitelisted APIs exposed via `contextBridge`
- Sandbox mode disabled for Node.js access in preload

## 3. Usage

```typescript
// Switch to pet mode
window.api.setMode('pet');

// Listen for mode changes
const unsubscribe = window.api.onModeChanged((mode) => {
  console.log('Mode changed to:', mode);
});

// Toggle mic from tray menu
window.api.onMicToggle(() => {
  toggleMicrophone();
});

// Update hover state for mouse passthrough
window.api.updateComponentHover('sidebar', true);

// Cleanup
unsubscribe();
```

---

## Appendix

### A. File Structure

```text
src/preload/
├── index.ts    # API implementation and contextBridge setup
└── index.d.ts  # TypeScript declarations for window.api
```

### B. Type Declarations

```typescript
interface Window {
  api: {
    setIgnoreMouseEvents: (ignore: boolean) => void;
    toggleForceIgnoreMouse: () => void;
    onModeChanged: (cb: (mode: "pet" | "window") => void) => void;
    showContextMenu: () => void;
    onMicToggle: (cb: () => void) => () => void;
    onInterrupt: (cb: () => void) => () => void;
    updateComponentHover: (id: string, isHovering: boolean) => void;
    // ... see index.d.ts for full list
  };
}
```

### C. Related Documents

- Main Process: [../main/README.md](../main/README.md)
- IPC Handlers Hook: [../feature/hook/README.md](../feature/hook/README.md)

