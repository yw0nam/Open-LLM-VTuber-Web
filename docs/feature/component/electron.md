# Electron Components

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Desktop app-specific UI components for window controls and pet mode input
- **I/O**: User interactions → IPC calls to main process, window state changes

## 2. Core Logic

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `TitleBar` | `title-bar.tsx` | Custom window title bar with controls |
| `PetModeInput` | `pet-mode-input.tsx` | Floating input overlay for pet mode |

### TitleBar Component

Custom frameless window title bar.

**Features:**
- App title/logo
- Window controls: Minimize, Maximize/Restore, Close
- Draggable area for window movement
- Fullscreen state handling

**Window Controls:**
```typescript
// IPC calls via window.electron.ipcRenderer
window.electron.ipcRenderer.send('window-minimize');
window.electron.ipcRenderer.send('window-maximize');
window.electron.ipcRenderer.send('window-close');
```

**State Listeners:**
- `window-maximized-change` - Maximize/restore state
- `window-fullscreen-change` - Fullscreen state

### PetModeInput Component

Floating input for pet mode when footer is hidden.

**Features:**
- Draggable position
- Text input with send button
- Visibility toggle via context menu
- Mouse passthrough when not focused

**Hooks Used:**
- `usePetInput` - Input state and submission
- `usePetDrag` - Draggable positioning

### Constraints

- Components only render when `window.api` exists
- TitleBar height: 30px (affects layout calculation)
- Pet mode input requires `toggle-input-subtitle` IPC event

## 3. Usage

```tsx
import TitleBar from '@/components/electron/title-bar';
import PetModeInput from '@/components/electron/pet-mode-input';

const isElectron = window.api !== undefined;
const { mode } = useMode();

// In app layout
{isElectron && <TitleBar />}

// In pet mode
{mode === 'pet' && <PetModeInput />}
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/components/electron/
├── title-bar.tsx        # Window title bar
├── pet-mode-input.tsx   # Pet mode floating input
└── electron-styles.tsx  # Shared styles
```

### B. IPC Channels

| Channel | Direction | Description |
|---------|-----------|-------------|
| `window-minimize` | R→M | Minimize window |
| `window-maximize` | R→M | Toggle maximize |
| `window-close` | R→M | Close window |
| `window-maximized-change` | M→R | Maximize state changed |
| `window-fullscreen-change` | M→R | Fullscreen state changed |
| `toggle-input-subtitle` | M→R | Toggle pet mode input visibility |

### C. Related Documents

- Electron Hooks: [../../hook/electron.md](../../hook/electron.md)
- Main Process: [../../../main/README.md](../../../main/README.md)
- Preload Scripts: [../../../preload/README.md](../../../preload/README.md)

