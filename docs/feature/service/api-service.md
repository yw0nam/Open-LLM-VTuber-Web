# API Service

Updated: 2025-12-03

## 1. Synopsis

- **Purpose**: Type-safe HTTP client for REST API communication with backend
- **I/O**: Request params/body → HTTP request → Validated response data
- **Location**: `src/renderer/src/services/api-service/`

## 2. Core Logic

### File Structure

```text
api-service/
├── core.ts      # HTTP client wrapper, error handling, base URL config
├── stm.ts       # Short-Term Memory (session/chat history) APIs
├── tts.ts       # Text-to-Speech synthesis API
├── vlm.ts       # Vision Language Model (image analysis) API
└── index.ts     # Barrel export
```

### Core HTTP Client (`core.ts`)

| Function | Signature | Description |
|----------|-----------|-------------|
| `setBaseURL` | `(url: string) => void` | Set API base URL |
| `getBaseURL` | `() => string` | Get current base URL |
| `get` | `<T>(path, options?, schema?) => Promise<T>` | GET request |
| `post` | `<T>(path, body?, options?, schema?) => Promise<T>` | POST request |
| `patch` | `<T>(path, body?, options?, schema?) => Promise<T>` | PATCH request |
| `del` | `<T>(path, options?, schema?) => Promise<T>` | DELETE request |
| `postFormData` | `<T>(path, formData, options?, schema?) => Promise<T>` | Multipart POST |

### API Modules

| Module | Endpoint Prefix | Methods |
|--------|-----------------|---------|
| `stmAPI` | `/stm` | `listSessions`, `getChatHistory`, `addChatHistory`, `updateSessionMetadata`, `deleteSession` |
| `ttsAPI` | `/tts` | `synthesizeSpeech` |
| `vlmAPI` | `/vlm` | `analyzeImage` |

### URL Configuration

**Default**: `http://127.0.0.1:5500/v1`

The base URL is managed via `WebSocketContext` and automatically synced to the API service:

| Location | Storage | Purpose |
|----------|---------|---------|
| `WebSocketContext` | localStorage (`baseUrl`) | User-configured URL from Settings |
| `core.ts` (module) | Memory | Actual URL used by HTTP client (auto-synced) |

> **Note**: When `baseUrl` changes in Settings, `WebSocketProvider` automatically calls `setBaseURL()` to update the API client.

## 3. Usage

### Initialize with Custom URL

```typescript
import { setBaseURL, stmAPI } from '@/services/api-service'

// Direct configuration (for programmatic use)
setBaseURL('http://your-server:5500/v1')

// For user configuration, use Settings UI
// WebSocketProvider automatically syncs baseUrl to API service
```

### STM API

```typescript
// List sessions
const { sessions } = await stmAPI.listSessions({
  user_id: 'user-123',
  agent_id: 'agent-456'
})

// Get chat history
const history = await stmAPI.getChatHistory({
  user_id: 'user-123',
  agent_id: 'agent-456',
  session_id: 'session-uuid'
})

// Add messages
await stmAPI.addChatHistory(
  { user_id, agent_id, session_id },
  { messages: [{ role: 'user', content: 'Hello!' }] }
)
```

### TTS API

```typescript
const result = await ttsAPI.synthesizeSpeech({
  text: 'Hello, world!',
  output_format: 'base64'
})
// result.audio_data: base64 encoded audio
```

### VLM API

```typescript
const result = await vlmAPI.analyzeImage({
  image: imageFile,
  prompt: 'What do you see?'
})
// result.analysis: description text
```

### Error Handling

```typescript
import { APIError } from '@/services/api-service'

try {
  await stmAPI.getChatHistory(params)
} catch (error) {
  if (error instanceof APIError) {
    console.error(`Status: ${error.status}, Message: ${error.message}`)
  }
}
```

---

## Appendix

### A. Settings Integration

The sidebar General Settings panel provides URL configuration:

| Setting | Context Property | localStorage Key |
|---------|------------------|------------------|
| WebSocket URL | `wsUrl` | `wsUrl` |
| Base URL | `baseUrl` | `baseUrl` |

To ensure API service uses the configured URL, sync on app initialization or context change.

### B. Related Documents

- [API Schemas](./schemas-api.md) - Request/Response type definitions
- [WebSocket Service](./websocket-service.md) - Real-time communication
- [Sidebar Settings](../component/sidebar.md) - URL configuration UI

