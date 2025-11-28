# Chat History Context

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Manages chat sessions, messages, and history loading via STM API
- **I/O**: Session selection → Messages array, history list, streaming updates

## 2. Core Logic

### Context Interface

```typescript
interface ChatHistoryState {
  messages: Message[];
  historyList: ListSessionsResponse;
  currentSessionId: string | null;
  isLoading: boolean;

  // Session management
  selectSession: (sessionId: string | null) => void;
  createNewSession: () => void;

  // UI message updates
  addUserMessageToUI: (content: string) => Promise<void>;

  // Streaming updates
  appendAIMessage: (content: string) => void;
  appendToolCallRequest: (toolCalls: { name: string; arguments: object }[]) => void;
  appendToolResult: (toolResultData: { tool_call_id: string; content: string; name: string }) => void;
  setForceNewMessage: (value: boolean) => void;
}
```

### Message Types

```typescript
type Message = UserMessage | AssistantMessage | ToolMessage | SystemMessage;

interface UserMessage { role: 'user'; id: string; content: string; timestamp: string; }
interface AssistantMessage { role: 'assistant'; id: string; content: string; timestamp: string; tool_calls?: ToolCall[]; }
interface ToolMessage { role: 'tool'; id: string; content: string; timestamp: string; tool_call_id: string; }
```

### Session Flow

```
createNewSession() → currentSessionId = null, messages = []
selectSession(id) → load messages from STM API
addUserMessageToUI() → add user message, send to backend
appendAIMessage() → streaming AI response tokens
```

### Streaming Update Logic

1. `stream_start` → Create new assistant message
2. `stream_token` → Append to current assistant message
3. `stream_end` → Finalize message
4. `tool_call` → Add tool_calls to assistant message
5. `tool_result` → Add tool message

### Constraints

- Requires `agentId` and `userId` from `CharacterConfigContext`
- Messages fetched from STM API on session selection
- Streaming updates are optimistic (UI updates before backend confirms)

## 3. Usage

```tsx
import { useChatHistory } from '@/context/chat-history-context';

function ChatPanel() {
  const { 
    messages, 
    historyList, 
    currentSessionId,
    selectSession,
    createNewSession,
    addUserMessageToUI 
  } = useChatHistory();

  // Display messages
  return (
    <div>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );

  // Send message
  const handleSend = async (content: string) => {
    await addUserMessageToUI(content);
  };

  // New session
  const handleNewSession = () => {
    createNewSession();
  };
}
```

---

## Appendix

### A. File Location

```text
src/renderer/src/context/chat-history-context.tsx
```

### B. Related Documents

- Types: [../types/README.md](../types/README.md)
- STM API: [../../api/api-stm.md](../../api/api-stm.md)
- Sidebar Components: [../component/sidebar.md](../component/sidebar.md)

