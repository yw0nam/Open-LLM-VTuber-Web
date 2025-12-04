# API Schemas

Updated: 2025-12-03

## 1. Synopsis

- **Purpose**: Zod schemas for REST API request/response validation (STM, TTS, VLM)
- **I/O**: `unknown` → `Schema.parse()` → Typed object (throws `ZodError` on failure)
- **Location**: `src/renderer/src/services/schemas/`

## 2. Core Logic

### STM Schemas (Session/Chat)

#### Session

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | `string` | ✓ | Unique session identifier |
| `user_id` | `string` | - | User identifier |
| `agent_id` | `string` | - | Agent identifier |
| `created_at` | `string` | - | ISO timestamp |
| `updated_at` | `string` | - | ISO timestamp |
| `metadata` | `Record<string, unknown>` | - | Additional metadata |

#### ListSessionsResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessions` | `Session[]` | ✓ | Array of session objects |

#### BackendChatMessage (Discriminated Union by `role`)

**Common Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | `'user' \| 'assistant' \| 'system' \| 'tool'` | ✓ | Message role |
| `content` | `string` | ✓ | Message content |
| `timestamp` | `string` | - | ISO timestamp |

**Role-specific Fields:**

| Role | Additional Fields |
|------|-------------------|
| `assistant` | `tool_calls?: ToolCall[]` |
| `tool` | `name: string`, `tool_call_id: string` |

#### ToolCall

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'function'` | ✓ | Always "function" |
| `id` | `string` | ✓ | Tool call ID |
| `function.name` | `string` | ✓ | Function name |
| `function.arguments` | `string` | ✓ | JSON string of arguments |

#### ChatHistory

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | `string (uuid)` | ✓ | Session UUID |
| `messages` | `Message[]` | ✓ | Transformed to frontend `Message` type |

#### AddChatHistoryRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | `RequestMessage[]` | ✓ | Messages to add |

#### AddChatHistoryResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session_id` | `string (uuid)` | ✓ | Session UUID |
| `message_count` | `number (int)` | ✓ | Total message count |

#### UpdateSessionMetadataRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `string` | - | New session title |
| `user_id` | `string` | - | New user ID |

#### UpdateSessionMetadataResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | `string` | ✓ | Success message |

---

### TTS Schemas

#### TTSSynthesizeRequest

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `text` | `string` | ✓ | - | Text to synthesize (min 1 char) |
| `reference_id` | `string` | - | - | Voice reference ID |
| `output_format` | `'bytes' \| 'base64'` | - | `'base64'` | Output format |

#### TTSSynthesizeResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio_data` | `string` | ✓ | Base64 or byte string |
| `format` | `'bytes' \| 'base64'` | ✓ | Actual output format |

---

### VLM Schemas

#### VLMAnalyzeRequest

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | `File \| Blob` | ✓ | Image to analyze |
| `prompt` | `string` | - | Analysis prompt |

#### VLMAnalyzeResponse

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `analysis` | `string` | ✓ | Analysis result text |

## 3. Usage

```typescript
import {
  SessionSchema,
  ChatHistorySchema,
  TTSSynthesizeRequestSchema,
  VLMAnalyzeRequestSchema,
  type Session,
  type TTSSynthesizeRequest
} from '@/services/schemas'

// Validate API response
const session = SessionSchema.parse(rawData)

// Create typed request
const ttsReq: TTSSynthesizeRequest = {
  text: 'Hello',
  output_format: 'base64'
}
TTSSynthesizeRequestSchema.parse(ttsReq)
```

---

## Appendix

### A. ChatHistory Transform

`ChatHistorySchema` uses `.transform()` to convert backend messages to frontend `Message` type:

- Generates frontend UUIDs
- Parses `tool_calls.arguments` from JSON string to object
- Guarantees `timestamp` with fallback

### B. Related Documents

- [Schemas Overview](./schemas.md) - Index document
- [WebSocket Schemas](./schemas-websocket.md) - WebSocket message schemas
- [API Service](./api-service.md) - Uses these schemas
