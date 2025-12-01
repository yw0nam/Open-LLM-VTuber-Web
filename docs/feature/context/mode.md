# Mode Context

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Application display mode management (Window vs Pet mode)
- **I/O**: Mode selection → UI layout and behavior changes

## 2. Core Logic

### Context Interface

```typescript
type ModeType = 'window' | 'pet';

interface ModeContextType {
  mode: ModeType;
  setMode: (mode: ModeType) => void;
}
```

### Mode Comparison

| Aspect | Window Mode | Pet Mode |
|--------|-------------|----------|
| Window frame | Normal with title bar | Frameless, transparent |
| Sidebar | Visible | Hidden |
| Footer | Visible | Hidden (use PetModeInput) |
| Always on top | No | Yes (screen-saver level) |
| Mouse passthrough | No | Yes (except on model hover) |
| Taskbar | Visible | Hidden |
| Multi-monitor | Single window | Spans all displays |

### Mode Switch Flow

```
User selects mode →
  setMode() →
  IPC: pre-mode-changed →
  Renderer prepares UI →
  IPC: renderer-ready-for-mode-change →
  Main applies window settings →
  IPC: mode-changed →
  Renderer completes transition
```

### Constraints

- Pet mode only available in Electron
- Mode switch involves window recreation
- Opacity animated during transition

## 3. Usage

```tsx
import { useMode } from '@/context/mode-context';

function ModeSelector() {
  const { mode, setMode } = useMode();
  const isElectron = window.api !== undefined;

  return (
    <select value={mode} onChange={(e) => setMode(e.target.value as ModeType)}>
      <option value="window">Window Mode</option>
      <option value="pet" disabled={!isElectron}>Pet Mode</option>
    </select>
  );
}

// Conditional rendering based on mode
function Layout() {
  const { mode } = useMode();
  
  return (
    <>
      {mode === 'window' && <Sidebar />}
      {mode === 'window' && <Footer />}
      {mode === 'pet' && <PetModeInput />}
      <Canvas />
    </>
  );
}
```

---

## Appendix

### A. File Location

```text
src/renderer/src/context/mode-context.tsx
```

### B. Related Documents

- Main Process: [../../main/README.md](../../main/README.md)
- Electron Components: [../component/electron.md](../component/electron.md)

