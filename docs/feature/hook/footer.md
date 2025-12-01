# Footer Hooks

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: React hooks for footer control logic including text input, mic toggle, and interruption
- **I/O**: User events → State updates, WebSocket messages, context changes

## 2. Core Logic

### Hooks Overview

| Hook | File | Purpose |
|------|------|---------|
| `useFooter` | `use-footer.ts` | Combined footer control logic |
| `useInputText` | (part of useFooter) | Text input state management |

### useFooter

Main hook providing all footer functionality.

**Output:**
```typescript
{
  // Text input
  inputValue: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyPress: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: () => void;
  
  // Microphone
  micOn: boolean;
  handleMicToggle: () => void;
  
  // Interrupt
  handleInterrupt: () => void;
}
```

### Text Input Logic

**Features:**
- Enter to send message (when not composing)
- Shift+Enter for newline
- IME composition support (prevents send during CJK input)
- Clears input after successful send

**Flow:**
```
User types → inputValue updates
User presses Enter → 
  if (isComposing) return
  if (Shift+Enter) insert newline
  else sendMessage() → clear input
```

### Mic Toggle Logic

**Flow:**
```
handleMicToggle() →
  if (aiState === THINKING_SPEAKING) interrupt first
  toggle micOn state →
  update VAD enabled state
```

### Interrupt Logic

**Flow:**
```
handleInterrupt() →
  set aiState to INTERRUPTED →
  send interrupt WebSocket message →
  stop current audio/lip sync →
  clear audio task queue
```

### Constraints

- IME composition must complete before Enter sends
- Mic toggle may trigger interrupt if AI is speaking
- Empty messages are not sent

## 3. Usage

```tsx
import { useFooter } from '@/hooks/footer/use-footer';

function FooterComponent() {
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    micOn,
  } = useFooter();

  return (
    <>
      <textarea
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyPress}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
      <button onClick={handleMicToggle}>
        {micOn ? 'Mic On' : 'Mic Off'}
      </button>
      <button onClick={handleInterrupt}>Interrupt</button>
    </>
  );
}
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/hooks/footer/
├── use-footer.ts        # Main footer hook
└── use-input-text.ts    # Text input logic (if separate)
```

### B. Context Dependencies

| Hook | Required Contexts |
|------|-------------------|
| `useFooter` | `AiStateContext`, `VADContext`, `WebSocketContext`, `ChatHistoryContext` |

### C. Related Documents

- Footer Components: [../component/footer.md](../component/footer.md)
- AI State Context: [../context/ai-state.md](../context/ai-state.md)
- Interrupt Hook: [./utils.md](./utils.md)

