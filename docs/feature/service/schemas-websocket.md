# WebSocket Schemas

Updated: 2025-12-03

## 1. Synopsis

- **Purpose**: Zod schemas for WebSocket message validation (Client ↔ Server)
- **I/O**: `unknown` → `WSClientMessageSchema.parse()` / `WSServerMessageSchema.parse()` → Typed message
- **Location**: `src/renderer/src/services/schemas/websocket.ts`

## 2. Core Logic

### Client → Server Messages

All client messages use discriminated union by `type` field.

#### `authorize`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'authorize'` | ✓ | Message type |
| `token` | `string` | ✓ | Authentication token |

#### `pong`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'pong'` | ✓ | Heartbeat response |

#### `chat_message`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | `'chat_message'` | ✓ | - | Message type |
| `content` | `string` | ✓ | - | User message content |
| `agent_id` | `string` | ✓ | - | Target agent ID |
| `user_id` | `string` | ✓ | - | Sender user ID |
| `persona` | `string` | - | - | Character persona |
| `images` | `string[]` | - | - | Base64 image array |
| `limit` | `number (int)` | - | `10` | History limit |
| `conversation_id` | `string (uuid)` | - | - | Existing conversation ID |
| `metadata` | `Record<string, unknown>` | - | - | Additional metadata |

#### `interrupt_stream`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'interrupt_stream'` | ✓ | Message type |
| `turn_id` | `string` | - | Specific turn to interrupt |

#### `fetch_backgrounds`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'fetch_backgrounds'` | ✓ | Request background list |

#### `fetch_avatar_configs`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'fetch_avatar_configs'` | ✓ | Request avatar config list |

#### `switch_avatar_config`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'switch_avatar_config'` | ✓ | Message type |
| `file` | `string` | ✓ | Avatar config filename |

---

### Server → Client Messages

All server messages use discriminated union by `type` field.

#### `authorize_success`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'authorize_success'` | ✓ | Message type |
| `connection_id` | `string (uuid)` | ✓ | Assigned connection ID |

#### `authorize_error`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'authorize_error'` | ✓ | Message type |
| `error` | `string` | ✓ | Error description |

#### `ping`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'ping'` | ✓ | Heartbeat request |

#### `stream_start`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'stream_start'` | ✓ | Message type |
| `turn_id` | `string (uuid)` | ✓ | Turn identifier |
| `conversation_id` | `string (uuid) \| null` | ✓ | Conversation ID |
| `connection_id` | `string (uuid)` | - | Connection ID |
| `user_id` | `string` | - | User ID |

#### `stream_token`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'stream_token'` | ✓ | Message type |
| `chunk` | `string` | ✓ | Text chunk |
| `node` | `string` | - | Processing node |
| `turn_id` | `string (uuid)` | ✓ | Turn identifier |

#### `stream_end`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'stream_end'` | ✓ | Message type |
| `turn_id` | `string` | ✓ | Turn identifier |
| `conversation_id` | `string \| null` | ✓ | Conversation ID |
| `content` | `string` | ✓ | Complete response |
| `connection_id` | `string (uuid)` | - | Connection ID |
| `user_id` | `string` | - | User ID |
| `metadata` | `Record<string, unknown>` | - | Additional metadata |

#### `tts_ready_chunk`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'tts_ready_chunk'` | ✓ | Message type |
| `chunk` | `string` | ✓ | TTS-ready text |
| `emotion` | `string` | - | Detected emotion |

#### `tool_call`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'tool_call'` | ✓ | Message type |
| `tool_name` | `string` | ✓ | Tool function name |
| `args` | `string` | ✓ | JSON string arguments |
| `node` | `string` | - | Processing node |

#### `tool_result`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'tool_result'` | ✓ | Message type |
| `result` | `string` | ✓ | JSON string result |
| `node` | `string` | - | Processing node |

#### `error`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'error'` | ✓ | Message type |
| `code` | `number (int)` | ✓ | Error code |
| `error` | `string` | ✓ | Error message |

#### `background_files`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'background_files'` | ✓ | Message type |
| `files` | `string[]` | ✓ | Background file list |

#### `avatar_config_files`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'avatar_config_files'` | ✓ | Message type |
| `configs` | `{ filename: string, name: string }[]` | ✓ | Avatar configs |

#### `avatar_config_switched`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'avatar_config_switched'` | ✓ | Message type |
| `file` | `string` | ✓ | Switched config filename |

#### `set_model_and_conf`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `'set_model_and_conf'` | ✓ | Message type |
| `model_info` | `Record<string, unknown>` | ✓ | Model information |
| `conf_name` | `string` | ✓ | Config name |
| `conf_uid` | `string` | ✓ | Config UID |
| `client_uid` | `string` | ✓ | Client UID |
| `persona_prompt` | `string` | - | Persona prompt |

## 3. Usage

```typescript
import {
  WSClientMessageSchema,
  WSServerMessageSchema,
  type WSChatMessage,
  type WSServerMessage
} from '@/services/schemas'

// Validate outgoing client message
const chatMsg: WSChatMessage = {
  type: 'chat_message',
  content: 'Hello',
  agent_id: 'agent-1',
  user_id: 'user-1'
}
WSClientMessageSchema.parse(chatMsg)

// Validate incoming server message
const serverMsg = WSServerMessageSchema.parse(rawData)
if (serverMsg.type === 'stream_token') {
  console.log(serverMsg.chunk) // TypeScript knows the type
}
```

---

## Appendix

### A. Related Documents

- [Schemas Overview](./schemas.md) - Index document
- [API Schemas](./schemas-api.md) - REST API schemas
- [WebSocket Service](./websocket-service.md) - Uses these schemas

