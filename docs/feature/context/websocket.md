# WebSocket Context

Updated: 2025-11-28

## 1. Synopsis

- **Purpose**: WebSocket connection management and message sending interface
- **I/O**: Connection config → WebSocket state, send methods

## 2. Core Logic

### Context Interface

```typescript
interface WebSocketContextProps {
  sendMessage: (message: Record<string, unknown>, options?: { requireAuth?: boolean }) => void;
  wsState: WebSocketConnectionState;
  reconnect: () => void;
  wsUrl: string;
  setWsUrl: (url: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
}
```

### Connection States

| State | Description |
|-------|-------------|
| `IDLE` | Not connected |
| `CONNECTING` | Establishing connection |
| `AUTHORIZING` | Sending auth token |
| `READY` | Authorized, ready for messages |
| `ERROR` | Connection error |
| `CLOSED` | Disconnected |

### Default Configuration

```typescript
const DEFAULT_WS_URL = "ws://127.0.0.1:5500/v1/chat/stream";
const DEFAULT_BASE_URL = "http://127.0.0.1:5500/v1";
const DEFAULT_AUTH_TOKEN = "test-token";
```

### Provider Behavior

1. On mount: Connects to WebSocket with stored URL/token
2. Subscribes to `wsService.onStateChange`
3. On URL change: Reconnects automatically
4. On unmount: Disconnects (no reconnect)

### Constraints

- URLs persist to localStorage
- Auto-reconnect: 5 attempts with 2s backoff
- Auth token required for message sending

## 3. Usage

```tsx
import { useWebSocket } from '@/context/websocket-context';

function Component() {
  const { sendMessage, wsState, reconnect, wsUrl, setWsUrl } = useWebSocket();

  // Check connection
  if (wsState === 'READY') {
    console.log('Connected and ready');
  }

  // Send message
  const handleSend = () => {
    sendMessage({
      type: 'chat_message',
      content: 'Hello!',
      agent_id: 'agent-1',
      user_id: 'user-1'
    });
  };

  // Change URL (triggers reconnect)
  const handleUrlChange = (newUrl: string) => {
    setWsUrl(newUrl);
  };

  // Manual reconnect
  const handleReconnect = () => {
    reconnect();
  };
}
```

---

## Appendix

### A. File Location

```text
src/renderer/src/context/websocket-context.tsx
```

### B. Related Documents

- WebSocket Service: [../../websocket/README.md](../../websocket/README.md)
- Client Messages: [../../websocket/ws-client-messages.md](../../websocket/ws-client-messages.md)

