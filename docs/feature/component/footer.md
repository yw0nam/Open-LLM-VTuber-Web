# Footer Components

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Bottom controls for microphone, text input, AI state display, and interruption
- **I/O**: User input → WebSocket messages, mic toggle, interrupt signals

## 2. Core Logic

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `Footer` | `footer.tsx` | Main container with all controls |
| `AIStateIndicator` | `ai-state-indicator.tsx` | Visual AI state feedback |
| `ActionButtons` | (in footer.tsx) | Mic and interrupt buttons |
| `MessageInput` | (in footer.tsx) | Text input area |

### Footer Component

Main footer container with collapsible behavior.

**Props:**
```typescript
interface FooterProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}
```

**Hook:** `useFooter()` provides all control logic:
- `inputValue`, `handleInputChange` - Text input state
- `handleKeyPress` - Enter to send (with IME composition support)
- `handleMicToggle`, `micOn` - Microphone control
- `handleInterrupt` - Interrupt AI response

### AIStateIndicator

Visual feedback for current AI state.

| State | Display |
|-------|---------|
| `idle` | Ready indicator |
| `listening` | Listening animation |
| `thinking-speaking` | Processing/speaking indicator |
| `interrupted` | Interrupted state |
| `loading` | Loading spinner |
| `waiting` | Waiting for input |

### ActionButtons

| Button | Icon | Action |
|--------|------|--------|
| Mic Toggle | `BsMicFill` / `BsMicMuteFill` | Toggle microphone on/off |
| Interrupt | `IoHandRightSharp` | Stop AI response |

### MessageInput

Text input with attachment button (placeholder).

**Features:**
- Multi-line textarea
- Enter to send (Shift+Enter for newline)
- IME composition support for CJK input
- Placeholder with i18n

### Constraints

- Footer hidden in pet mode (use `PetModeInput` instead)
- IME composition prevents Enter-to-send during input
- Mic state synced with VAD context

## 3. Usage

```tsx
import Footer from '@/components/footer/footer';

// In layout
const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

<Footer 
  isCollapsed={isFooterCollapsed} 
  onToggle={() => setIsFooterCollapsed(!isFooterCollapsed)} 
/>
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/components/footer/
├── footer.tsx           # Main footer component
├── ai-state-indicator.tsx  # State display
└── footer-styles.tsx    # Shared styles
```

### B. Context Dependencies

| Component | Required Contexts |
|-----------|-------------------|
| `Footer` | `AiStateContext`, `VADContext`, `WebSocketContext` |
| `AIStateIndicator` | `AiStateContext` |

### C. Related Documents

- Footer Hooks: [../../hook/footer.md](../../hook/footer.md)
- AI State Context: [../../context/ai-state.md](../../context/ai-state.md)

