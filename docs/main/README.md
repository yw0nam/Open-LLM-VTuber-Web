# Electron Main Process

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Electron main process handling window management, system tray, and IPC communication
- **I/O**: IPC events from renderer → Window/tray actions, system operations

## 2. Core Logic

### Entry Point (`index.ts`)

Initializes app, sets up IPC handlers, and manages lifecycle.

| IPC Channel | Direction | Description |
|-------------|-----------|-------------|
| `get-platform` | invoke | Returns `process.platform` |
| `set-ignore-mouse-events` | on | Toggle mouse passthrough |
| `get-current-mode` | sync | Returns `"window"` or `"pet"` |
| `pre-mode-changed` | on | Triggers mode switch |
| `window-minimize/maximize/close` | on | Window controls |
| `update-component-hover` | on | Track hover state for mouse passthrough |
| `get-screen-capture` | invoke | Returns primary screen source ID |

### WindowManager (`window-manager.ts`)

Manages BrowserWindow state and mode switching.

| Method | Description |
|--------|-------------|
| `createWindow(options)` | Creates transparent, frameless window |
| `setWindowMode(mode)` | Switch between `"window"` / `"pet"` mode |
| `setIgnoreMouseEvents(ignore)` | Enable/disable mouse passthrough |
| `maximizeWindow()` | Toggle maximize state |
| `updateComponentHover(id, isHovering)` | Track hovering for pet mode |
| `toggleForceIgnoreMouse()` | Force mouse passthrough on/off |

**Mode Behaviors:**

| Mode | Always On Top | Mouse Events | Resizable | Taskbar |
|------|---------------|--------------|-----------|---------|
| Window | No | Normal | Yes | Visible |
| Pet | Yes (screen-saver) | Passthrough | No | Hidden |

### MenuManager (`menu-manager.ts`)

System tray and context menus.

| Method | Description |
|--------|-------------|
| `createTray()` | Create system tray with icon |
| `setMode(mode)` | Update mode and rebuild menu |
| `updateConfigFiles(files)` | Update character switcher submenu |
| `destroy()` | Clean up tray |

**Tray Menu Items:**
- Window/Pet Mode toggle (radio)
- Toggle Mouse Passthrough (pet mode only)
- Show/Hide window
- Exit

### Constraints

- macOS uses `titleBarStyle: "hiddenInset"` for traffic lights
- Pet mode spans all displays for multi-monitor dragging
- Media permission auto-granted for camera/mic access

## 3. Usage

```typescript
// Window mode switch (from renderer via preload)
window.api.setMode('pet');

// Check current mode
const mode = window.electron.ipcRenderer.sendSync('get-current-mode');

// Toggle mouse passthrough
window.api.toggleForceIgnoreMouse();
```

---

## Appendix

### A. File Structure

```text
src/main/
├── index.ts          # Entry point, IPC setup, lifecycle
├── window-manager.ts # BrowserWindow management
└── menu-manager.ts   # System tray and context menus
```

### B. IPC Event Flow

```
Renderer ──[pre-mode-changed]──► Main (MenuManager.setMode)
                                     │
                                     ▼
Main ──[pre-mode-changed]──► Renderer (prepare UI)
                                     │
                                     ▼
Renderer ──[renderer-ready-for-mode-change]──► Main (apply mode)
                                     │
                                     ▼
Main ──[mode-changed]──► Renderer (complete)
```

### C. Related Documents

- Preload Scripts: [../preload/README.md](../preload/README.md)
- Mode Context: [../feature/context/README.md](../feature/context/README.md)

