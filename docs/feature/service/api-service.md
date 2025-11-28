# API Service

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Type-safe HTTP client for REST API communication with backend
- **I/O**: Request params/body → HTTP request → Validated response data

## 2. Core Logic

### File Structure

```
api-service/
├── core.ts      # HTTP client wrapper, error handling, base URL config
├── stm.ts       # Short-Term Memory (session/chat history) APIs
├── tts.ts       # Text-to-Speech synthesis API
├── vlm.ts       # Vision Language Model (image analysis) API
└── index.ts     # Barrel export
```

### Core HTTP Client (`core.ts`)

| Function | Description |
|----------|-------------|
| `setBaseURL(url)` | Configure API base URL |
| `getBaseURL()` | Get current base URL |
| `get<T>(path, options, schema)` | GET request with validation |
| `post<T>(path, body, options, schema)` | POST request with validation |
| `patch<T>(path, body, options, schema)` | PATCH request with validation |
| `del<T>(path, options, schema)` | DELETE request with validation |
| `postFormData<T>(path, formData, options, schema)` | Multipart form POST |

### API Modules

| Module | Endpoint Prefix | Methods |
|--------|-----------------|---------|
| `stmAPI` | `/stm` | `listSessions`, `getChatHistory`, `addChatHistory`, `updateSessionMetadata`, `deleteSession` |
| `ttsAPI` | `/tts` | `synthesizeSpeech` |
| `vlmAPI` | `/vlm` | `analyzeImage` |

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

## 3. Usage

### STM API - Session Management

```typescript
import { stmAPI } from '@/services/api-service'

// List sessions
const sessions = await stmAPI.listSessions({
  user_id: 'user-123',
  agent_id: 'agent-456'
})

// Get chat history
const history = await stmAPI.getChatHistory({
  user_id: 'user-123',
  agent_id: 'agent-456',
  session_id: 'session-uuid',
  limit: 50
})

// Add messages
await stmAPI.addChatHistory(
  { user_id: 'user-123', agent_id: 'agent-456', session_id: 'session-uuid' },
  { messages: [{ role: 'user', content: 'Hello!' }] }
)

// Delete session
await stmAPI.deleteSession('session-uuid', { user_id: 'user-123', agent_id: 'agent-456' })
```

### TTS API - Speech Synthesis

```typescript
import { ttsAPI } from '@/services/api-service'

const result = await ttsAPI.synthesizeSpeech({
  text: 'Hello, world!',
  output_format: 'base64',
  reference_id: 'voice-id-123' // optional voice cloning
})
// result.audio_data contains base64 encoded audio
```

### VLM API - Image Analysis

```typescript
import { vlmAPI } from '@/services/api-service'

const result = await vlmAPI.analyzeImage({
  image: imageFile, // File or Blob
  prompt: 'What do you see in this image?'
})
// result.analysis contains the description
```

---

## Appendix

### A. Configuration

Default base URL: `http://127.0.0.1:5500/v1`

```typescript
import { setBaseURL, getBaseURL } from '@/services/api-service'

setBaseURL('http://your-server:5500/v1')
console.log(getBaseURL()) // http://your-server:5500/v1
```

### B. Type Exports

All request/response types are re-exported from `index.ts`:

```typescript
import type {
  ListSessionsResponse,
  Session,
  ChatHistory,
  TTSSynthesizeRequest,
  TTSSynthesizeResponse,
  VLMAnalyzeRequest,
  VLMAnalyzeResponse
} from '@/services/api-service'
```

### C. Related Documents

- [Schemas](./schemas.md) - Validation schemas for API types
- Backend REST API: `backend/docs/api/REST_API_GUIDE.md`

