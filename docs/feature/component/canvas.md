# Canvas Components

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Live2D model rendering, background display, subtitles, and WebSocket status indicator
- **I/O**: Context state → Visual canvas elements with Live2D interactions

## 2. Core Logic

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `Live2D` | `live2d.tsx` | Renders Live2D model with drag, expressions, lip sync |
| `Background` | `background.tsx` | Displays background image or camera feed |
| `Subtitle` | `subtitle.tsx` | Animated subtitle with typewriter effect |
| `WsStatus` | `ws-status.tsx` | WebSocket connection indicator |
| `Canvas` | `canvas.tsx` | Container orchestrating all canvas elements |

### Live2D Component

Main component for Live2D model rendering.

**Props:**
```typescript
interface Live2DProps {
  showSidebar?: boolean;  // Affects resize calculation
}
```

**Hooks Used:**
- `useLive2DModel` - Model loading, drag handling
- `useLive2DResize` - Canvas resizing and scaling
- `useLive2DExpression` - Expression/emotion control
- `useAudioTask` - TTS audio playback with lip sync
- `useInterrupt` - Conversation interruption
- `useIpcHandlers` - Electron IPC event handling
- `useForceIgnoreMouse` - Pet mode mouse passthrough

**Features:**
- Right-click context menu in pet mode
- Expression reset on AI idle state
- Drag support for model positioning

### Background Component

Displays background from URL or camera stream.

**Priority:** Camera stream > Background URL > Default

### Subtitle Component

Typewriter animation for AI responses.

**Features:**
- Animated text display
- Visibility toggle
- Auto-hide after completion

### Constraints

- Requires Live2D SDK loaded in `public/libs/`
- Canvas uses WebGL rendering
- Pet mode enables mouse passthrough on canvas areas

## 3. Usage

```tsx
import { Live2D } from '@/components/canvas/live2d';
import { Background } from '@/components/canvas/background';
import { Subtitle } from '@/components/canvas/subtitle';
import { WsStatus } from '@/components/canvas/ws-status';

// In canvas container
<div style={{ position: 'relative', width: '100%', height: '100%' }}>
  <Background />
  <Live2D showSidebar={!isSidebarCollapsed} />
  <Subtitle />
  <WsStatus />
</div>
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/components/canvas/
├── canvas.tsx         # Container component
├── live2d.tsx         # Live2D model renderer
├── background.tsx     # Background display
├── subtitle.tsx       # Subtitle overlay
├── ws-status.tsx      # Connection indicator
└── canvas-styles.tsx  # Shared styles
```

### B. Context Dependencies

| Component | Required Contexts |
|-----------|-------------------|
| `Live2D` | `Live2DConfigContext`, `AiStateContext`, `ModeContext` |
| `Background` | `BgUrlContext`, `CameraContext` |
| `Subtitle` | `SubtitleContext` |
| `WsStatus` | `WebSocketContext` |

### C. Related Documents

- Canvas Hooks: [../../hook/canvas.md](../../hook/canvas.md)
- Live2D Config Context: [../../context/live2d-config.md](../../context/live2d-config.md)

