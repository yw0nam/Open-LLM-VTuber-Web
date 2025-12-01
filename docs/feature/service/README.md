# Services

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: Provides API communication layer (REST + WebSocket) between frontend and backend
- **I/O**: User actions/data → HTTP/WS requests → Backend responses → UI updates

## 2. Structure Overview

```text
services/
├── api-service/       # REST API client (HTTP requests)
├── schemas/           # Zod schemas for request/response validation
└── websocket-service/ # WebSocket client and message handling
```

| Module | Responsibility |
|--------|----------------|
| **api-service** | HTTP client for STM, TTS, VLM endpoints |
| **schemas** | Type-safe validation using Zod |
| **websocket-service** | Real-time bidirectional communication |

## 3. Module Documentation

- [API Service](./api-service.md) - REST API client implementation
- [Schemas](./schemas.md) - Zod schemas and TypeScript types
- [WebSocket Service](./websocket-service.md) - WebSocket client and handlers

## 4. Quick Start

```typescript
import { stmAPI, ttsAPI, vlmAPI, setBaseURL } from '@/services/api-service'
import { wsService } from '@/services/websocket-service/client'

// Configure REST API base URL
setBaseURL('http://localhost:5500/v1')

// Connect WebSocket
wsService.connect('ws://localhost:5500/v1/chat/stream')

// Use REST APIs
const sessions = await stmAPI.listSessions({ user_id: '123', agent_id: '456' })
```

---

## Appendix

### A. Related Documents

- [WebSocket Context](../context/websocket.md) - WebSocket state management
- [Chat History Context](../context/chat-history.md) - Message state management

### B. Backend API References

- REST API Guide: `backend/docs/api/REST_API_GUIDE.md`
- WebSocket API Guide: `backend/docs/api/WEBSOCKET_API_GUIDE.md`

