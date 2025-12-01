# VAD Context

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Voice Activity Detection state and configuration management
- **I/O**: VAD settings → Detection state, enable/disable controls

## 2. Core Logic

### Context Interface

```typescript
interface VADContextType {
  vadEnabled: boolean;
  setVadEnabled: (enabled: boolean) => void;
  vadStatus: 'idle' | 'listening' | 'speech';
  setVadStatus: (status: 'idle' | 'listening' | 'speech') => void;
  isListening: boolean;
  isSpeechDetected: boolean;
}
```

### VAD Status States

| Status | Description |
|--------|-------------|
| `idle` | VAD not active |
| `listening` | VAD active, waiting for speech |
| `speech` | Speech detected |

### Integration with @ricky0123/vad-web

Provider initializes VAD with:
- Model: Silero VAD
- Sample rate: 16kHz
- Speech threshold configuration

### Status Flow

```
vadEnabled = true → vadStatus = 'listening'
Speech detected → vadStatus = 'speech' → AI state = LISTENING
Speech ends → Send audio → vadStatus = 'listening'
vadEnabled = false → vadStatus = 'idle'
```

### Constraints

- Requires microphone permission
- VAD model loaded asynchronously
- Speech detection threshold configurable

## 3. Usage

```tsx
import { useVad } from '@/context/vad-context';

function MicControl() {
  const { vadEnabled, setVadEnabled, vadStatus, isListening, isSpeechDetected } = useVad();

  // Toggle VAD
  const toggleMic = () => {
    setVadEnabled(!vadEnabled);
  };

  // Check status
  return (
    <div>
      <button onClick={toggleMic}>
        {vadEnabled ? 'Mic On' : 'Mic Off'}
      </button>
      {isSpeechDetected && <span>Speaking...</span>}
    </div>
  );
}
```

---

## Appendix

### A. File Location

```text
src/renderer/src/context/vad-context.tsx
```

### B. Related Documents

- Footer Components: [../component/footer.md](../component/footer.md)
- Send Audio Hook: [../hook/utils.md](../hook/utils.md)

