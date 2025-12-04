# WebSocket Service

Updated: 2025-12-03

## 1. Synopsis

- **Purpose**: Real-time bidirectional communication with backend for streaming chat
- **I/O**: User messages → WebSocket → Server responses (tokens, audio, tool calls)
- **Location**: `src/renderer/src/services/websocket-service/`

## 2. Core Logic

### File Structure

```text
websocket-service/
├── client.ts              # WebSocketService singleton class
├── websocket-handler.tsx  # React context provider for WS state
└── handlers/
    ├── index.ts           # Message handler registry
    ├── types.ts           # Handler dependency types
    ├── agent_messages.ts  # Stream/tool message handlers
    ├── fetch_handlers.ts  # Background/avatar handlers
    └── handleTTSReadyChunk.ts  # TTS audio processing
```

### URL Configuration

| URL | Default | Storage | Purpose |
|-----|---------|---------|---------|
| WebSocket URL | `ws://127.0.0.1:5500/v1/chat/stream` | localStorage (`wsUrl`) | Real-time streaming |
| Base URL | `http://127.0.0.1:5500/v1` | localStorage (`baseUrl`) | REST API & asset URLs |

URLs are configured via:

- **Settings UI**: Sidebar → General Settings → `wsUrl` / `baseUrl` fields
- **Context**: `useWebSocket()` returns `{ wsUrl, setWsUrl, baseUrl, setBaseUrl }`

### WebSocketService (`client.ts`)

| Method | Description |
|--------|-------------|
| `connect(url, options?)` | Establish connection |
| `disconnect(options?)` | Close connection |
| `sendMessage(message, options?)` | Send generic message |
| `sendChatMessage(message)` | Send validated chat message |
| `sendInterrupt(message)` | Interrupt active stream |
| `onMessage(callback)` | Subscribe to incoming messages |
| `onStateChange(callback)` | Subscribe to connection state |

### Connection States

```typescript
type WebSocketConnectionState =
  | 'IDLE'        // Initial state
  | 'CONNECTING'  // Establishing connection
  | 'OPEN'        // Socket open
  | 'AUTHORIZING' // Sending auth token
  | 'READY'       // Authorized, ready to use
  | 'CLOSING'     // Disconnecting
  | 'CLOSED'      // Disconnected
  | 'ERROR'       // Connection error
```

### Message Handlers (`handlers/`)

Handlers are registered in `index.ts` and dispatched by message type:

| Handler | Message Types |
|---------|---------------|
| `agentHandlers` | `stream_start`, `stream_token`, `stream_end`, `tool_call`, `tool_result`, `tts_ready_chunk` |
| `fetchHandlers` | `background_files`, `avatar_config_files` |
| Built-in | `error`, `authorize_success`, `authorize_error`, `ping` |

## 3. Usage

### Basic Connection

```typescript
import { wsService } from '@/services/websocket-service/client'

// Connect with auto-reconnect
wsService.connect('ws://localhost:5500/v1/chat/stream', {
  token: 'your-auth-token',
  autoReconnect: true
})

// Listen for state changes
wsService.onStateChange((state) => {
  console.log('Connection state:', state)
})

// Disconnect
wsService.disconnect()
```

### Sending Messages

```typescript
import { wsService } from '@/services/websocket-service/client'

// Send chat message (requires authorization)
wsService.sendChatMessage({
  type: 'chat_message',
  content: 'Hello!',
  agent_id: 'agent-456',
  user_id: 'user-123',
  limit: 10
})

// Interrupt active stream
wsService.sendInterrupt({
  type: 'interrupt_stream',
  turn_id: 'current-turn-uuid'
})
```

### Receiving Messages

```typescript
import { wsService } from '@/services/websocket-service/client'

const subscription = wsService.onMessage((message) => {
  switch (message.type) {
    case 'stream_token':
      console.log('Token:', message.chunk)
      break
    case 'tts_ready_chunk':
      console.log('TTS ready:', message.chunk)
      break
    case 'stream_end':
      console.log('Stream complete')
      break
  }
})

// Cleanup
subscription.unsubscribe()
```

### Using WebSocketHandlerProvider

```tsx
import { WebSocketHandlerProvider, useWebSocketHandler } from '@/services/websocket-service/websocket-handler'

// Wrap app with provider
function App() {
  return (
    <WebSocketHandlerProvider>
      <ChatComponent />
    </WebSocketHandlerProvider>
  )
}

// Use in components
function ChatComponent() {
  const { sendMessage, wsState, wsUrl, setWsUrl } = useWebSocketHandler()
  
  return (
    <div>
      <span>Status: {wsState}</span>
      <button onClick={() => sendMessage({ type: 'chat_message', ... })}>
        Send
      </button>
    </div>
  )
}
```

---

## Appendix

### A. Handler Dependencies

Handlers receive injected dependencies via `WebSocketHandlerDeps`:

```typescript
interface WebSocketHandlerDeps {
  aiState: AiState
  setAiState: (state: AiState) => void
  addAudioTask: (task: AudioTask) => void
  chatHistory: { appendAIMessage, appendToolCallRequest, appendToolResult, setForceNewMessage }
  config: CharacterConfig  // includes setPersonaPrompt for persona_prompt handling
  bgUrl: BgUrlContext
  live2d: Live2DConfig
  baseUrl: string
  t: (key: string) => string
  toaster: ToasterAPI
}
```

**Note:** The `set_model_and_conf` handler extracts `persona_prompt` from the server message and stores it via `config.setPersonaPrompt()`. This value is then used by `useTextInput` to include in `chat_message` WebSocket payloads.

### B. Auto-Reconnection

- Max attempts: 5
- Backoff: 2 seconds between attempts
- Heartbeat timeout: 45 seconds

### C. Message Queue

Messages sent before authorization are queued and sent after `READY` state.

### D. Related Documents

- [Schemas](./schemas.md) - WebSocket message schemas
- [WebSocket Context](../context/websocket.md) - React context for WS state
- [AI State Context](../context/ai-state.md) - State updated by handlers
- Backend WebSocket API: `backend/docs/api/WEBSOCKET_API_GUIDE.md`

