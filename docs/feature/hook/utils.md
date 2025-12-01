# Utility Hooks

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Reusable utility hooks for audio, interruption, storage, IPC, and media operations
- **I/O**: Various inputs → Side effects, state, callbacks

## 2. Core Logic

### Hooks Overview

| Hook | File | Purpose |
|------|------|---------|
| `useAudioTask` | `use-audio-task.ts` | Audio playback with lip sync |
| `useInterrupt` | `use-interrupt.ts` | Conversation interruption |
| `useLocalStorage` | `use-local-storage.ts` | localStorage persistence |
| `useMicToggle` | `use-mic-toggle.ts` | Microphone toggle |
| `useSendAudio` | `use-send-audio.tsx` | Send audio to backend |
| `useTriggerSpeak` | `use-trigger-speak.ts` | Proactive speak trigger |
| `useIpcHandlers` | `use-ipc-handlers.ts` | Electron IPC handlers |
| `useForceIgnoreMouse` | `use-force-ignore-mouse.ts` | Pet mode mouse passthrough |
| `useSwitchCharacter` | `use-switch-character.tsx` | Character switching |
| `useMediaCapture` | `use-media-capture.tsx` | Media capture utilities |

### useAudioTask

Manages TTS audio playback with Live2D lip sync.

**Output:**
```typescript
{
  playAudio: (base64Audio: string) => Promise<void>;
  stopAudio: () => void;
  isPlaying: boolean;
}
```

**Flow:**
1. Receives base64 audio from WebSocket `tts_ready_chunk`
2. Queues in `audioTaskQueue` for sequential playback
3. Sets up lip sync via `audioManager`
4. Handles completion and cleanup

### useInterrupt

Handles conversation interruption.

**Output:**
```typescript
{
  interrupt: () => void;
}
```

**Actions:**
1. Set AI state to `INTERRUPTED`
2. Send `interrupt_stream` WebSocket message
3. Stop audio via `audioManager.stopCurrentAudioAndLipSync()`
4. Clear `audioTaskQueue`

### useLocalStorage

Generic localStorage persistence hook.

**Signature:**
```typescript
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]
```

**Features:**
- SSR-safe (checks window existence)
- JSON serialization
- Sync across hook instances

### useIpcHandlers

Sets up all Electron IPC event listeners.

**Events Handled:**
- `mic-toggle` → Toggle microphone
- `interrupt` → Interrupt conversation
- `toggle-input-subtitle` → Toggle pet mode UI
- `toggle-scroll-to-resize` → Toggle scroll resize
- `switch-character` → Switch Live2D model

**Usage:** Call once in root component.

### useForceIgnoreMouse

Pet mode mouse passthrough control.

**Output:**
```typescript
{
  forceIgnoreMouse: boolean;
  toggleForceIgnoreMouse: () => void;
}
```

### useSwitchCharacter

Character/model switching logic.

**Output:**
```typescript
{
  switchCharacter: (configFilename: string) => Promise<void>;
  isLoading: boolean;
}
```

### Constraints

- `useIpcHandlers` must be called only once
- Audio hooks require Live2D model loaded
- IPC hooks require Electron environment

## 3. Usage

```tsx
import { useAudioTask } from '@/hooks/utils/use-audio-task';
import { useInterrupt } from '@/hooks/utils/use-interrupt';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { useIpcHandlers } from '@/hooks/utils/use-ipc-handlers';

// Audio playback
const { playAudio, stopAudio } = useAudioTask();
await playAudio(base64AudioChunk);

// Interruption
const { interrupt } = useInterrupt();
interrupt();

// Local storage
const [theme, setTheme] = useLocalStorage('theme', 'dark');

// IPC handlers (call once in App)
function App() {
  useIpcHandlers();
  return <MainContent />;
}
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/hooks/utils/
├── use-audio-task.ts
├── use-interrupt.ts
├── use-local-storage.ts
├── use-mic-toggle.ts
├── use-send-audio.tsx
├── use-trigger-speak.ts
├── use-ipc-handlers.ts
├── use-force-ignore-mouse.ts
├── use-switch-character.tsx
└── use-media-capture.tsx
```

### B. Context Dependencies

| Hook | Required Contexts |
|------|-------------------|
| `useAudioTask` | `AiStateContext`, `SubtitleContext`, `Live2DConfigContext` |
| `useInterrupt` | `AiStateContext`, `WebSocketContext` |
| `useMicToggle` | `VADContext`, `AiStateContext` |
| `useSendAudio` | `WebSocketContext`, `CharacterConfigContext` |
| `useIpcHandlers` | `ModeContext`, `AiStateContext`, `VADContext` |

### C. Related Documents

- Audio Manager: [../../utils/README.md](../../utils/README.md)
- AI State Context: [../context/ai-state.md](../context/ai-state.md)

