# Sidebar Hooks

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: React hooks for sidebar state, chat history, settings panels, and media controls
- **I/O**: User interactions → State updates, API calls, context changes

## 2. Core Logic

### Hooks Overview

| Hook | File | Purpose |
|------|------|---------|
| `useSidebar` | `use-sidebar.ts` | Sidebar state and actions |
| `useChatHistory` | `use-chat-history.ts` | Chat history loading |
| `useHistoryDrawer` | `use-history-drawer.ts` | History drawer state |
| `useCameraPanel` | `use-camera-panel.ts` | Camera controls |
| `useScreenCapturePanel` | `use-screen-capture-panel.ts` | Screen capture |
| Setting panel hooks | `use-*-panel.ts` | Individual setting panels |

### useSidebar

Main sidebar state management.

**Output:**
```typescript
{
  isOpen: boolean;
  toggle: () => void;
  activeTab: 'chat' | 'settings';
  setActiveTab: (tab: 'chat' | 'settings') => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}
```

### useChatHistory

Manages chat message loading and display.

**Output:**
```typescript
{
  messages: Message[];
  isLoading: boolean;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}
```

### useHistoryDrawer

Controls session history drawer.

**Output:**
```typescript
{
  isOpen: boolean;
  open: () => void;
  close: () => void;
  sessions: Session[];
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
}
```

### useCameraPanel

Camera stream controls.

**Output:**
```typescript
{
  isActive: boolean;
  start: () => Promise<void>;
  stop: () => void;
  stream: MediaStream | null;
  error: Error | null;
}
```

### useScreenCapturePanel

Screen capture controls.

**Output:**
```typescript
{
  isCapturing: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  stream: MediaStream | null;
}
```

### Setting Panel Hooks

| Hook | Purpose |
|------|---------|
| `useGeneralPanel` | Language, theme settings |
| `useAgentPanel` | Agent/user ID configuration |
| `useAsrPanel` | ASR settings |
| `useTtsPanel` | TTS settings |
| `useLive2dPanel` | Model selection, expressions |

### Constraints

- Camera/screen capture require user permission
- Settings persist to localStorage
- Session deletion is irreversible

## 3. Usage

```tsx
import { useSidebar } from '@/hooks/sidebar/use-sidebar';
import { useCameraPanel } from '@/hooks/sidebar/use-camera-panel';

function SidebarComponent() {
  const { isOpen, toggle, activeTab, setActiveTab } = useSidebar();
  const { isActive, start, stop } = useCameraPanel();

  return (
    <div>
      <button onClick={toggle}>{isOpen ? 'Close' : 'Open'}</button>
      <button onClick={() => setActiveTab('chat')}>Chat</button>
      <button onClick={() => setActiveTab('settings')}>Settings</button>
      
      <button onClick={isActive ? stop : start}>
        {isActive ? 'Stop Camera' : 'Start Camera'}
      </button>
    </div>
  );
}
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/hooks/sidebar/
├── use-sidebar.ts
├── use-chat-history.ts
├── use-history-drawer.ts
├── use-camera-panel.ts
├── use-screen-capture-panel.ts
├── use-general-panel.ts
├── use-agent-panel.ts
├── use-asr-panel.ts
├── use-tts-panel.ts
└── use-live2d-panel.ts
```

### B. Context Dependencies

| Hook | Required Contexts |
|------|-------------------|
| `useSidebar` | `ModeContext` |
| `useChatHistory` | `ChatHistoryContext` |
| `useCameraPanel` | `CameraContext` |
| `useScreenCapturePanel` | `ScreenCaptureContext` |
| `useLive2dPanel` | `Live2DConfigContext` |

### C. Related Documents

- Sidebar Components: [../component/sidebar.md](../component/sidebar.md)
- Chat History Context: [../context/chat-history.md](../context/chat-history.md)

