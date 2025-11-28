# AI State Context

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Global AI state machine managing conversation lifecycle states
- **I/O**: State transitions → Components react to AI state changes

## 2. Core Logic

### State Machine

| State | Enum | Description |
|-------|------|-------------|
| `idle` | `IDLE` | Ready for input, can be triggered proactively |
| `thinking-speaking` | `THINKING_SPEAKING` | AI processing/responding, can be interrupted |
| `interrupted` | `INTERRUPTED` | User interrupted the response |
| `loading` | `LOADING` | Initial load or character switching |
| `listening` | `LISTENING` | Speech detected via VAD |
| `waiting` | `WAITING` | User typing, auto-returns to IDLE after 2s |

### State Transitions

```
LOADING → IDLE (initial load complete)
IDLE → LISTENING (speech detected)
IDLE → THINKING_SPEAKING (message sent)
IDLE → WAITING (user typing)
LISTENING → THINKING_SPEAKING (speech ends, processing)
LISTENING → INTERRUPTED (user action)
THINKING_SPEAKING → IDLE (response complete)
THINKING_SPEAKING → INTERRUPTED (user interrupts)
INTERRUPTED → IDLE (cleanup complete)
WAITING → IDLE (2s timeout)
```

### Context Interface

```typescript
interface AiStateContextType {
  aiState: AiState;
  setAiState: (state: AiState | ((current: AiState) => AiState)) => void;
  backendSynthComplete: boolean;
  setBackendSynthComplete: (complete: boolean) => void;
  
  // Convenience helpers
  isIdle: boolean;
  isThinkingSpeaking: boolean;
  isInterrupted: boolean;
  isLoading: boolean;
  isListening: boolean;
  isWaiting: boolean;
  
  resetState: () => void;
}
```

### Constraints

- Only one state active at a time
- `INTERRUPTED` triggers audio/queue cleanup
- `WAITING` has 2s auto-timeout to `IDLE`

## 3. Usage

```tsx
import { useAiState, AiStateEnum } from '@/context/ai-state-context';

function Component() {
  const { aiState, setAiState, isIdle, isThinkingSpeaking } = useAiState();

  // Check state
  if (isThinkingSpeaking) {
    showInterruptButton();
  }

  // Set state
  const handleInterrupt = () => {
    setAiState(AiStateEnum.INTERRUPTED);
  };

  // Conditional state transition
  setAiState((current) => 
    current === AiStateEnum.IDLE ? AiStateEnum.THINKING_SPEAKING : current
  );
}
```

---

## Appendix

### A. File Location

```text
src/renderer/src/context/ai-state-context.tsx
```

### B. Related Documents

- Footer Components: [../component/footer.md](../component/footer.md)
- Interrupt Hook: [../hook/utils.md](../hook/utils.md)
