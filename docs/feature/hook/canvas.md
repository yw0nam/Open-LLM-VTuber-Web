# Canvas Hooks

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: React hooks for Live2D model management, rendering, and canvas interactions
- **I/O**: Context state → Model control, canvas refs, event handlers

## 2. Core Logic

### Hooks Overview

| Hook | File | Purpose |
|------|------|---------|
| `useLive2DModel` | `use-live2d-model.ts` | Model loading, drag, interactions |
| `useLive2DExpression` | `use-live2d-expression.ts` | Expression/emotion control |
| `useLive2DResize` | `use-live2d-resize.ts` | Canvas resizing and scaling |
| `useSubtitleDisplay` | `use-subtitle-display.ts` | Subtitle animation timing |
| `useBackground` | `use-background.ts` | Background URL management |
| `useWsStatus` | `use-ws-status.ts` | WebSocket status indicator |

### useLive2DModel

Main hook for Live2D model loading and interactions.

**Input:**
```typescript
interface UseLive2DModelProps {
  modelInfo: ModelInfo | null;
  canvasRef: RefObject<HTMLCanvasElement>;
}
```

**Output:**
```typescript
{
  isDragging: boolean;
  handlers: {
    onMouseDown: (e: React.PointerEvent) => void;
    onMouseMove: (e: React.PointerEvent) => void;
    onMouseUp: () => void;
  };
}
```

**Features:**
- Loads Live2D model from modelInfo path
- Handles model dragging/positioning
- Manages LAppAdapter lifecycle
- Exposes `window.getLAppAdapter()` for external access

### useLive2DExpression

Controls Live2D model expressions/emotions.

**Output:**
```typescript
{
  setExpression: (value: string | number, adapter: LAppAdapter, logMsg?: string) => void;
  resetExpression: (adapter: LAppAdapter, modelInfo: ModelInfo) => void;
  currentExpression: string | null;
}
```

**Expression Types:**
- By name: `"happy"`, `"sad"`, `"angry"`
- By index: `0`, `1`, `2` (from model's expression list)

### useLive2DResize

Handles canvas resizing and model scaling.

**Input:**
```typescript
interface UseLive2DResizeProps {
  containerRef: RefObject<HTMLDivElement>;
  modelInfo: ModelInfo | null;
  showSidebar?: boolean;
}
```

**Output:**
```typescript
{
  canvasRef: RefObject<HTMLCanvasElement>;
  scale: number;
  updateScale: (newScale: number) => void;
}
```

### useSubtitleDisplay

Manages subtitle typewriter animation.

**Output:**
```typescript
{
  displayText: string;      // Currently visible text
  isAnimating: boolean;     // Animation in progress
  fullText: string;         // Complete subtitle text
}
```

### Constraints

- `useLive2DModel` requires Live2D SDK in `public/libs/`
- Canvas must use WebGL context
- Model loading is async; check `isLoading` state

## 3. Usage

```tsx
import { useLive2DModel } from '@/hooks/canvas/use-live2d-model';
import { useLive2DResize } from '@/hooks/canvas/use-live2d-resize';
import { useLive2DExpression } from '@/hooks/canvas/use-live2d-expression';

function Live2DComponent({ modelInfo }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { canvasRef } = useLive2DResize({
    containerRef,
    modelInfo,
    showSidebar: true,
  });

  const { isDragging, handlers } = useLive2DModel({
    modelInfo,
    canvasRef,
  });

  const { setExpression, resetExpression } = useLive2DExpression();

  return (
    <div ref={containerRef} {...handlers}>
      <canvas ref={canvasRef} />
    </div>
  );
}
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/hooks/canvas/
├── use-live2d-model.ts
├── use-live2d-expression.ts
├── use-live2d-resize.ts
├── use-subtitle-display.ts
├── use-background.ts
└── use-ws-status.ts
```

### B. Context Dependencies

| Hook | Required Contexts |
|------|-------------------|
| `useLive2DModel` | `Live2DConfigContext` |
| `useLive2DExpression` | None (uses LAppAdapter directly) |
| `useLive2DResize` | `Live2DConfigContext` |
| `useSubtitleDisplay` | `SubtitleContext` |
| `useBackground` | `BgUrlContext` |
| `useWsStatus` | `WebSocketContext` |

### C. Related Documents

- Canvas Components: [../component/canvas.md](../component/canvas.md)
- Live2D Config Context: [../context/live2d-config.md](../context/live2d-config.md)

