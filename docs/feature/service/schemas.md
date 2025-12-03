# Schemas

Updated: 2025-12-03

## 1. Synopsis

- **Purpose**: Zod validation schemas for API/WebSocket request/response type safety
- **I/O**: `unknown` (raw data) → `Schema.parse()` → Typed TypeScript object (throws `ZodError` on failure)
- **Location**: `src/renderer/src/services/schemas/`

## 2. Core Logic

### File Structure

```text
schemas/
├── index.ts      # Barrel export for all schemas
├── stm.ts        # STM (session/chat) schemas
├── tts.ts        # TTS (speech synthesis) schemas
├── vlm.ts        # VLM (image analysis) schemas
└── websocket.ts  # WebSocket message schemas
```

### Schema Categories

| Category | Document | Description |
|----------|----------|-------------|
| **API Schemas** | [schemas-api.md](./schemas-api.md) | STM, TTS, VLM request/response |
| **WebSocket Schemas** | [schemas-websocket.md](./schemas-websocket.md) | Client/Server message types |

### Pattern: Schema + Type Export

Always export both schema and inferred type:

```typescript
export const MySchema = z.object({ field: z.string() })
export type MyType = z.infer<typeof MySchema>
```

## 3. Usage

```typescript
// Import from barrel export
import {
  // API schemas
  SessionSchema,
  TTSSynthesizeRequestSchema,
  VLMAnalyzeRequestSchema,
  // WebSocket schemas
  WSClientMessageSchema,
  WSServerMessageSchema,
  // Types
  type Session,
  type WSServerMessage
} from '@/services/schemas'

// Validate and get typed data
const session = SessionSchema.parse(rawData)
const wsMessage = WSServerMessageSchema.parse(rawWsData)
```

---

## Appendix

### A. Related Documents

- [API Schemas](./schemas-api.md) - Full I/O spec for STM/TTS/VLM
- [WebSocket Schemas](./schemas-websocket.md) - Full I/O spec for WebSocket messages
- [API Service](./api-service.md) - REST API client using these schemas
- [WebSocket Service](./websocket-service.md) - WebSocket client using these schemas

