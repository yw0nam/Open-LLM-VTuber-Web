# Integration Guide: Open-LLM-VTuber-Web ↔ DesktopMatePlus Backend

## Overview

This guide explains how to connect the Open-LLM-VTuber-Web frontend (Live2D desktop pet) with the DesktopMatePlus backend (streaming text generation with TTS and memory management).

**Backend:** `localhost:5500` (FastAPI + WebSocket)  
**Frontend:** Electron + React + TypeScript + Live2D

## Architecture

```
┌─────────────────────────────┐
│  Open-LLM-VTuber-Web       │
│  (Electron + React)         │
│  - Live2D Model Display     │
│  - Audio Playback           │
│  - User Interface           │
└──────────┬──────────────────┘
           │
           │ WebSocket + HTTP
           │
┌──────────▼──────────────────┐
│  DesktopMatePlus Backend    │
│  (FastAPI)                  │
│  - Text Generation Stream   │
│  - TTS Synthesis            │
│  - STM/LTM Management       │
│  - VLM Image Analysis       │
└─────────────────────────────┘
```

## Key Differences & Adaptation Strategy

### Current Frontend Expects

The Open-LLM-VTuber-Web expects these message types:
- `control` - Control commands (start-mic, stop-mic, conversation-chain-start/end)
- `audio` - Audio with volumes array for lip-sync
- `text` - Text messages for display
- `tool_call_status` - Tool execution status
- Various other types (backgrounds, configs, etc.)

### Backend Provides

The DesktopMatePlus backend provides:
- `authorize_success` - Connection confirmation
- `stream_start` - Stream beginning marker
- `stream_token` - Individual tokens (internal, not sent to client)
- `tts_ready_chunk` - Complete sentences ready for TTS
- `stream_end` - Stream completion marker
- `tool_call` / `tool_result` - Tool execution events
- `error` - Error messages
- `ping` - Heartbeat

## Integration Steps

### Step 1: Update Frontend Configuration

Update the default WebSocket URL in the frontend:

**File:** `Open-LLM-VTuber-Web/src/renderer/src/context/websocket-context.tsx`

```typescript
// Change from:
const DEFAULT_WS_URL = 'ws://127.0.0.1:12393/client-ws';
const DEFAULT_BASE_URL = 'http://127.0.0.1:12393';

// To:
const DEFAULT_WS_URL = 'ws://127.0.0.1:5500/v1/chat/stream';
const DEFAULT_BASE_URL = 'http://127.0.0.1:5500';
```

### Step 2: Create Backend Adapter Service

Create a new adapter service to translate between the two systems:

**File:** `Open-LLM-VTuber-Web/src/renderer/src/services/desktopmate-adapter.tsx`

See the implementation file created separately.

### Step 3: Update WebSocket Service

Modify the WebSocket service to use the adapter:

**File:** `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-service.tsx`

Add authentication flow and message adaptation.

### Step 4: Update Message Handler

**File:** `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-handler.tsx`

Update to handle new message types and TTS workflow.

## Message Flow Comparison

### Original System

```
Client → { type: "send-message", text: "Hello" }
Server → { type: "text", content: "Response..." }
Server → { type: "audio", audio: "base64...", volumes: [...] }
```

### DesktopMatePlus System

```
Client → { type: "authorize", token: "demo-token" }
Server → { type: "authorize_success", connection_id: "..." }
Client → { type: "chat_message", messages: [...] }
Server → { type: "stream_start" }
Server → { type: "tts_ready_chunk", chunk: "First sentence.", sentence_index: 0 }
Client → Call TTS API: POST /v1/tts/synthesize
Server (TTS) → { audio_data: "base64...", format: "wav" }
Server → { type: "tts_ready_chunk", chunk: "Second sentence.", sentence_index: 1 }
Server → { type: "stream_end", full_response: "..." }
```

## API Endpoints

### WebSocket API

**URL:** `ws://localhost:5500/v1/chat/stream`

**Client Messages:**
- `authorize` - Authenticate connection
- `chat_message` - Send chat message
- `pong` - Heartbeat response

**Server Messages:**
- `authorize_success` - Authentication successful
- `stream_start` - Response stream starting
- `tts_ready_chunk` - Sentence ready for TTS
- `stream_end` - Response complete
- `tool_call` - Tool execution started
- `tool_result` - Tool execution completed
- `error` - Error occurred
- `ping` - Heartbeat check

### HTTP APIs

#### 1. TTS Synthesis

**URL:** `POST http://localhost:5500/v1/tts/synthesize`

**Request:**
```json
{
  "text": "Hello, world!",
  "reference_id": "ナツメ",
  "output_format": "base64"
}
```

**Response:**
```json
{
  "audio_data": "UklGRi4...",
  "format": "wav",
  "sample_rate": 24000,
  "duration": 1.5
}
```

#### 2. VLM Image Analysis

**URL:** `POST http://localhost:5500/v1/vlm/analyze`

**Request:**
```json
{
  "images": ["data:image/png;base64,..."],
  "question": "What's in this image?"
}
```

**Response:**
```json
{
  "description": "The image shows..."
}
```

#### 3. Short-Term Memory

**Get Chat History:**
```
GET http://localhost:5500/v1/stm/chat-history?user_id=user1&agent_id=agent1&session_id=session1
```

**Add Chat History:**
```
POST http://localhost:5500/v1/stm/chat-history
{
  "user_id": "user1",
  "agent_id": "agent1",
  "session_id": "session1",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" }
  ]
}
```

**List Sessions:**
```
GET http://localhost:5500/v1/stm/sessions?user_id=user1&agent_id=agent1
```

**Delete Session:**
```
DELETE http://localhost:5500/v1/stm/sessions/{session_id}
```


##### Note

Actual memory management is handled by backend. So, the frontend only needs to call list and create/delete sessions as needed.
Add chat history and get chat history is optional api. Not required for basic chat functionality.

When frontend want to create new session, just generate new session_id (e.g. UUID or even non-session-id) and use it in chat messages.
Backend will auto-create session and corresponding chat_history if it does not exist. and return new-session-id(if don't pass session_id, if you pass the new-session-id, it will be used) in response.

## Implementation Tasks

### Required Changes

1. **WebSocket Context** ✓
   - Update default URLs
   - Add authorization flow
   - Handle new message types

2. **WebSocket Service** ✓
   - Send authorize message on connect
   - Respond to ping messages
   - Translate message formats

3. **WebSocket Handler** ✓
   - Handle `tts_ready_chunk` events
   - Call TTS API when chunks arrive
   - Update chat history format
   - Handle stream_start/stream_end

4. **Audio Processing**
   - Convert base64 WAV to playable format
   - Extract volume data for lip-sync (optional)
   - Queue audio chunks for playback

5. **Chat History**
   - Need to display session list.
   - Create new sessions
   - List past conversations
   - Delete sessions

### Optional Enhancements

1. **Voice Selection**
   - Add UI for selecting reference_id using dropdown
   - Available voices: ナツメ, etc.

2. **Session Management**
   - Create new sessions
   - Delete old sessions

3. **Image Analysis**
   - Screenshot capture integration
   - Send to VLM API
   - Display results in chat

## Configuration

### Frontend Configuration

The frontend stores configuration in localStorage:
- `wsUrl` - WebSocket URL
- `baseUrl` - Base HTTP URL

Users can change these in the settings UI.

## Testing

### 1. Start Backend

```bash
cd backend
uv run src/main.py --port 5500
```

Backend should be running at `http://localhost:5500`

### 2. Test WebSocket Connection

```bash
cd backend
uv run python examples/realtime_tts_streaming_demo.py
```

This demo shows the complete flow:
- Connect to WebSocket
- Authorize
- Send message
- Receive streaming response
- Get TTS chunks
- Synthesize audio

### 3. Start Frontend

```bash
cd Open-LLM-VTuber-Web
npm install
npm run dev
```

### 4. Test Integration

1. Open the frontend
2. Check WebSocket connection status
3. Send a test message
4. Verify:
   - Message appears in chat
   - Audio plays through Live2D
   - Lip-sync works
   - Character responds

## Troubleshooting

### WebSocket Connection Failed

**Issue:** Cannot connect to `ws://localhost:5500/v1/chat/stream`

**Solutions:**
- Check backend is running: `curl http://localhost:5500/health`
- Verify URL in frontend settings
- Check browser console for errors

### No Audio Playback

**Issue:** TTS chunks received but no audio plays

**Solutions:**
- Check browser audio permissions
- Verify base64 decoding
- Check WAV format compatibility
- Test TTS API directly: `curl -X POST http://localhost:5500/v1/tts/synthesize -H "Content-Type: application/json" -d '{"text":"test","reference_id":"ナツメ"}'`

### Authorization Failed

**Issue:** `authorize_error` message received

**Solutions:**
- Check token in frontend code (default: "demo-token")
- Verify backend authentication settings
- Check backend logs for errors

### Missing Lip-Sync

**Issue:** Audio plays but character doesn't move lips

**Solutions:**
- Verify volume data extraction from WAV
- Check Live2D model configuration
- Verify audio task queue is working

## Next Steps

1. Implement the adapter service
2. Update WebSocket service and handler
3. Test basic chat flow
4. Add TTS integration
5. Implement session management
6. Add VLM image analysis
7. Polish UI/UX
8. Add error handling
9. Performance optimization
10. Production deployment

## Resources

- Backend API Documentation: `backend/docs/api/`
- Frontend Source: `Open-LLM-VTuber-Web/src/renderer/src/`
- Example Code: `backend/examples/`
- Live2D SDK: `Open-LLM-VTuber-Web/src/renderer/WebSDK/`

## Support

For backend issues:
- Check `backend/docs/api/README.md`
- Review Python examples in `backend/examples/`

For frontend issues:
- Check existing websocket-handler.tsx
- Review Live2D integration code

## License

Follow the licenses of both projects:
- DesktopMatePlus Backend: (Check backend LICENSE)
- Open-LLM-VTuber-Web: See `Open-LLM-VTuber-Web/LICENSE`
