# Electron Hooks

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: React hooks for Electron-specific functionality including pet mode drag and input
- **I/O**: User interactions → IPC calls, window positioning, input handling

## 2. Core Logic

### Hooks Overview

| Hook | File | Purpose |
|------|------|---------|
| `usePetDrag` | `use-pet-drag.ts` | Pet mode window dragging |
| `usePetInput` | `use-pet-input.ts` | Pet mode floating input |

### usePetDrag

Handles dragging of Live2D model in pet mode.

**Output:**
```typescript
{
  isDragging: boolean;
  position: { x: number; y: number };
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
  };
}
```

**Features:**
- Tracks drag state and position
- Updates model position during drag
- Works across multiple monitors (pet mode spans all displays)
- Mouse passthrough when not dragging

**Drag Flow:**
```
onMouseDown → isDragging = true, capture start position
onMouseMove → if dragging, update position delta
onMouseUp → isDragging = false, finalize position
```

### usePetInput

Manages floating input overlay in pet mode.

**Output:**
```typescript
{
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSubmit: () => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}
```

**Features:**
- Text input state management
- Submit message to WebSocket
- Visibility toggle via IPC event
- IME composition support

**IPC Integration:**
- Listens to `toggle-input-subtitle` to show/hide
- Sends chat message via WebSocket on submit

### Constraints

- Only functional when `window.api` exists
- Pet mode must be active
- Drag position persists during session only

## 3. Usage

```tsx
import { usePetDrag } from '@/hooks/electron/use-pet-drag';
import { usePetInput } from '@/hooks/electron/use-pet-input';

function PetModeOverlay() {
  const { isDragging, position, dragHandlers } = usePetDrag();
  const { inputValue, setInputValue, handleSubmit, isVisible } = usePetInput();

  return (
    <>
      {/* Draggable model area */}
      <div
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        {...dragHandlers}
      >
        <Live2DModel />
      </div>

      {/* Floating input */}
      {isVisible && (
        <div className="floating-input">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
      )}
    </>
  );
}
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/hooks/electron/
├── use-pet-drag.ts    # Drag functionality
└── use-pet-input.ts   # Input handling
```

### B. IPC Events Used

| Event | Direction | Description |
|-------|-----------|-------------|
| `toggle-input-subtitle` | M→R | Toggle input visibility |
| `update-component-hover` | R→M | Report hover for mouse passthrough |

### C. Related Documents

- Electron Components: [../component/electron.md](../component/electron.md)
- Main Process: [../../main/README.md](../../main/README.md)
- Mode Context: [../context/mode.md](../context/mode.md)

