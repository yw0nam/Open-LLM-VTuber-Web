# Schemas

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Zod validation schemas for API request/response type safety
- **I/O**: Raw data → Schema validation → Typed TypeScript objects

## 2. Core Logic

### File Structure

```
schemas/
├── index.ts      # Barrel export for all schemas
├── stm.ts        # STM (session/chat) schemas
├── tts.ts        # TTS (speech synthesis) schemas
├── vlm.ts        # VLM (image analysis) schemas
└── websocket.ts  # WebSocket message schemas
```

### Schema Modules

| Module | Exports |
|--------|---------|
| `stm.ts` | Session, ChatMessage, ChatHistory schemas |
| `tts.ts` | TTSSynthesizeRequest/Response schemas |
| `vlm.ts` | VLMAnalyzeRequest/Response schemas |
| `websocket.ts` | Client/Server WebSocket message schemas |

### Pattern: Schema + Type Export

```typescript
// Define schema
export const MySchema = z.object({
  field: z.string()
})

// Export inferred type
export type MyType = z.infer<typeof MySchema>
```

## 3. Usage

### STM Schemas

```typescript
import {
  SessionSchema,
  ChatHistorySchema,
  BackendChatMessageSchema,
  AddChatHistoryRequestSchema,
  type Session,
  type ChatHistory,
  type AddChatHistoryRequest
} from '@/services/schemas'

// Validate data
const session = SessionSchema.parse(rawData)

// Type-safe usage
const history: ChatHistory = {
  messages: [{ role: 'user', content: 'Hello' }],
  metadata: { title: 'Chat 1' }
}
```

### TTS Schemas

```typescript
import {
  TTSSynthesizeRequestSchema,
  TTSSynthesizeResponseSchema,
  type TTSSynthesizeRequest,
  type TTSSynthesizeResponse
} from '@/services/schemas'

const request: TTSSynthesizeRequest = {
  text: 'Hello world',
  output_format: 'base64'
}
TTSSynthesizeRequestSchema.parse(request) // Validates
```

### VLM Schemas

```typescript
import {
  VLMAnalyzeRequestSchema,
  VLMAnalyzeResponseSchema,
  type VLMAnalyzeRequest,
  type VLMAnalyzeResponse
} from '@/services/schemas'

const request: VLMAnalyzeRequest = {
  image: file, // File or Blob
  prompt: 'Describe this image'
}
```

### WebSocket Schemas

```typescript
import {
  // Client messages
  WSChatMessageSchema,
  WSInterruptStreamMessageSchema,
  WSClientMessageSchema,
  // Server messages
  WSStreamTokenMessageSchema,
  WSTTSReadyChunkMessageSchema,
  WSServerMessageSchema,
  // Types
  type WSChatMessage,
  type WSServerMessage
} from '@/services/schemas'

// Validate incoming server message
const message = WSServerMessageSchema.parse(rawMessage)

// Type guard via discriminated union
if (message.type === 'stream_token') {
  console.log(message.chunk) // TypeScript knows this is WSStreamTokenMessage
}
```

---

## Appendix

### A. WebSocket Message Types

**Client → Server:**

| Type | Purpose |
|------|---------|
| `authorize` | Authenticate connection |
| `pong` | Heartbeat response |
| `chat_message` | Send user message |
| `interrupt_stream` | Cancel active stream |
| `fetch_backgrounds` | Request background list |
| `fetch_avatar_configs` | Request avatar config list |
| `switch_avatar_config` | Change avatar |

**Server → Client:**

| Type | Purpose |
|------|---------|
| `authorize_success` | Auth confirmed |
| `authorize_error` | Auth failed |
| `ping` | Heartbeat |
| `stream_start` | Response stream begins |
| `stream_token` | Text chunk |
| `stream_end` | Response stream ends |
| `tts_ready_chunk` | Audio-ready text |
| `tool_call` | Tool invocation |
| `tool_result` | Tool response |
| `error` | Server error |

### B. Chat Message Roles

```typescript
type ChatRole = 'user' | 'assistant' | 'system' | 'tool'
```

### C. Related Documents

- [API Service](./api-service.md) - Uses these schemas for validation
- [WebSocket Service](./websocket-service.md) - Uses WebSocket schemas

