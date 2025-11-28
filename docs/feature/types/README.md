# Types

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: TypeScript type definitions for chat messages and shared data structures
- **I/O**: Type imports → Type-safe component props and function signatures

## 2. Core Logic

### Chat Types (`types/chat.ts`)

#### Base Message Interface

All messages share common properties:

```typescript
interface BaseMessage {
  id: string;        // Unique ID for React rendering
  content: string;   // Message content
  timestamp: string; // ISO timestamp
}
```

#### Role-Specific Types

| Type | Role | Additional Fields |
|------|------|-------------------|
| `UserMessage` | `"user"` | — |
| `AssistantMessage` | `"assistant"` | `tool_calls?: { name, arguments }[]` |
| `ToolMessage` | `"tool"` | `tool_call_id`, `name?` |
| `SystemMessage` | `"system"` | — |

#### Union Type

```typescript
type Message = UserMessage | AssistantMessage | ToolMessage | SystemMessage;
```

#### Helper Types

| Type | Purpose |
|------|---------|
| `HistoryInfo` | Session with messages: `{ sessionId, messages }` |
| `BackgroundFile` | Background file info: `{ name, url }` |

### Constraints

- `id` is required for React list rendering (use UUID)
- `tool_calls` only valid on `AssistantMessage`
- `tool_call_id` required on `ToolMessage`

## 3. Usage

```typescript
import { Message, UserMessage, AssistantMessage, ToolMessage } from '@/types/chat';

// Create user message
const userMsg: UserMessage = {
  id: crypto.randomUUID(),
  role: 'user',
  content: 'Hello!',
  timestamp: new Date().toISOString(),
};

// Create assistant message with tool calls
const assistantMsg: AssistantMessage = {
  id: crypto.randomUUID(),
  role: 'assistant',
  content: 'Let me check...',
  timestamp: new Date().toISOString(),
  tool_calls: [{ name: 'search', arguments: { query: 'weather' } }],
};

// Type guard
function isAssistantMessage(msg: Message): msg is AssistantMessage {
  return msg.role === 'assistant';
}

// Render messages
messages.map((msg: Message) => (
  <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
));
```

---

## Appendix

### A. File Structure

```text
src/renderer/src/types/
└── chat.ts    # Chat message type definitions
```

### B. Complete Type Definitions

```typescript
// Base
interface BaseMessage {
  id: string;
  content: string;
  timestamp: string;
}

// Role types
interface UserMessage extends BaseMessage { role: "user"; }
interface AssistantMessage extends BaseMessage {
  role: "assistant";
  tool_calls?: { name: string; arguments: object; }[];
}
interface ToolMessage extends BaseMessage {
  role: "tool";
  tool_call_id: string;
  name?: string;
}
interface SystemMessage extends BaseMessage { role: "system"; }

// Union
type Message = UserMessage | AssistantMessage | ToolMessage | SystemMessage;

// Helpers
interface HistoryInfo { sessionId: string; messages: Message[]; }
interface BackgroundFile { name: string; url: string; }
```

### C. Related Documents

- Chat History Context: [./context/README.md](./context/README.md)
- Services (Schemas): [./service/README.md](./service/README.md)

