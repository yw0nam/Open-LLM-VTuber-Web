# DesktopMatePlus + Open-LLM-VTuber-Web Integration Summary

## 📋 What Was Done

I've prepared a complete integration package to connect your DesktopMatePlus backend (running on `localhost:5500`) with the Open-LLM-VTuber-Web frontend (Live2D desktop pet).

## 📁 Files Created

### 1. Documentation

- **`INTEGRATION_GUIDE.md`** - Comprehensive integration guide
  - Architecture overview
  - Message flow comparison
  - API endpoints reference
  - Configuration guide
  - Troubleshooting tips

- **`QUICK_INTEGRATION.md`** - Step-by-step implementation guide
  - Exact code changes needed
  - Testing procedures
  - Complete example flow
  - Common issues and fixes

### 2. Frontend Code

- **`Open-LLM-VTuber-Web/src/renderer/src/services/desktopmate-adapter.tsx`**
  - Message translation layer between backend and frontend
  - TTS API integration
  - VLM API integration
  - Audio volume extraction for lip-sync

- **`Open-LLM-VTuber-Web/src/renderer/src/config/desktopmate-config.ts`**
  - Centralized configuration
  - Feature flags
  - API endpoints
  - Voice settings

## 🎯 Key Features Implemented

### 1. Real-time Streaming
```
User sends message → Backend streams response → 
Sentences detected → TTS synthesized in real-time → 
Character speaks while still generating
```

### 2. WebSocket Integration
- ✅ Authorization flow
- ✅ Ping/pong heartbeat
- ✅ Message format adaptation
- ✅ Error handling

### 3. TTS Integration
- ✅ Automatic TTS synthesis for streamed chunks
- ✅ Base64 audio decoding
- ✅ Volume extraction for lip-sync
- ✅ Audio queue management

### 4. Additional Features
- ✅ VLM image analysis (for screenshots)
- ✅ Session management (STM)
- ✅ Chat history persistence
- ✅ Configurable voices

## 🚀 Quick Start

### Step 1: Start Backend

```bash
cd backend
python -m src.main
```

Verify it's running:
```bash
curl http://localhost:5500/health
```

### Step 2: Apply Frontend Changes

Make these key changes to the frontend:

#### A. Update WebSocket URL
`Open-LLM-VTuber-Web/src/renderer/src/context/websocket-context.tsx`:
```typescript
const DEFAULT_WS_URL = 'ws://127.0.0.1:5500/v1/chat/stream';
const DEFAULT_BASE_URL = 'http://127.0.0.1:5500';
```

#### B. Add Adapter to WebSocket Service
`Open-LLM-VTuber-Web/src/renderer/src/services/websocket-service.tsx`:

1. Import the adapter:
```typescript
import { desktopMateAdapter } from './desktopmate-adapter';
```

2. Send authorization on connect:
```typescript
this.ws.onopen = () => {
  this.currentState = 'OPEN';
  this.stateSubject.next('OPEN');
  
  // Send auth
  const authMsg = desktopMateAdapter.createAuthorizeMessage('demo-token');
  this.ws?.send(authMsg);
  
  this.initializeConnection();
};
```

3. Handle ping/pong and adapt messages:
```typescript
this.ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  // Handle ping
  if (message.type === 'ping') {
    this.ws?.send(desktopMateAdapter.createPongMessage());
    return;
  }
  
  // Adapt message
  const adapted = desktopMateAdapter.adaptMessage(message);
  if (adapted) {
    this.messageSubject.next(adapted);
  }
};
```

#### C. Add TTS Handler
`Open-LLM-VTuber-Web/src/renderer/src/services/websocket-handler.tsx`:

In the message handler, add TTS processing:
```typescript
case 'text':
  if ((message as any)._needs_tts) {
    const chunk = message.content;
    
    desktopMateAdapter.synthesizeSpeech(chunk, 'ナツメ')
      .then(async (audioBase64) => {
        if (audioBase64) {
          const volumes = await desktopMateAdapter.extractVolumes(audioBase64);
          addAudioTask({
            type: 'audio',
            audio: audioBase64,
            volumes: volumes,
            slice_length: volumes.length,
            display_text: { text: chunk, name: 'AI', avatar: '' },
          });
        }
      });
  }
  setSubtitleText(message.content);
  break;
```

### Step 3: Run Frontend

```bash
cd Open-LLM-VTuber-Web
npm install
npm run dev
```

### Step 4: Test

1. Type a message: "Hello"
2. Watch for:
   - ✅ WebSocket connects
   - ✅ Authorization succeeds
   - ✅ Message sent to backend
   - ✅ Response streamed in real-time
   - ✅ TTS chunks synthesized
   - ✅ Character speaks with lip-sync

## 📊 Message Flow

### What Happens When You Send "Hello"

```
Frontend: User types "Hello"
    ↓
Frontend: sendMessage({ type: 'send-message', text: 'Hello' })
    ↓
Adapter: Convert to { type: 'chat_message', messages: [...] }
    ↓
Backend: Receive and process
    ↓
Backend: Send { type: 'stream_start' }
    ↓
Adapter: Convert to { type: 'control', text: 'conversation-chain-start' }
    ↓
Frontend: Clear UI, show thinking state
    ↓
Backend: Generate response "Hello! How can I help you?"
    ↓
Backend: Detect sentence "Hello!"
    ↓
Backend: Send { type: 'tts_ready_chunk', chunk: 'Hello!', ... }
    ↓
Adapter: Convert to { type: 'text', _needs_tts: true, ... }
    ↓
Handler: Call synthesizeSpeech('Hello!')
    ↓
TTS API: Return base64 WAV audio
    ↓
Handler: Extract volumes, add to audio queue
    ↓
Live2D: Play audio with lip-sync
    ↓
Backend: Continue with next sentence...
    ↓
Backend: Send { type: 'stream_end', full_response: '...' }
    ↓
Adapter: Convert to { type: 'control', text: 'conversation-chain-end' }
    ↓
Frontend: Show idle state, done!
```

## 🔧 Configuration

### Backend Configuration
Edit `backend/.env`:
```bash
# Required
OPENAI_API_KEY=your_key_here

# Optional (defaults shown)
LLM_PROVIDER=openai
OPENAI_MODEL_NAME=gpt-4
TTS_PROVIDER=kokoro
HOST=0.0.0.0
PORT=5500
```

### Frontend Configuration
Settings are in `desktopmate-config.ts`:
- WebSocket URL: `ws://127.0.0.1:5500/v1/chat/stream`
- HTTP URL: `http://127.0.0.1:5500`
- Default voice: `ナツメ`
- Auth token: `demo-token`

Users can change these in the frontend UI (stored in localStorage).

## 📚 API Reference

### WebSocket API
**URL:** `ws://localhost:5500/v1/chat/stream`

**Events:**
- Client → `authorize` - Authenticate
- Server → `authorize_success` - Auth OK
- Client → `chat_message` - Send message
- Server → `stream_start` - Response starting
- Server → `tts_ready_chunk` - Sentence ready for TTS
- Server → `stream_end` - Response complete
- Server → `ping` - Heartbeat
- Client → `pong` - Heartbeat response

### HTTP APIs

**TTS Synthesis:**
```bash
POST /v1/tts/synthesize
{
  "text": "Hello!",
  "reference_id": "ナツメ",
  "output_format": "base64"
}
```

**VLM Analysis:**
```bash
POST /v1/vlm/analyze
{
  "images": ["data:image/png;base64,..."],
  "question": "What's in this image?"
}
```

**Chat History:**
```bash
GET /v1/stm/chat-history?user_id=user1&session_id=session1
POST /v1/stm/chat-history { user_id, session_id, messages: [...] }
```

Full API documentation: `backend/docs/api/`

## 🐛 Troubleshooting

### WebSocket Won't Connect
```bash
# Check backend is running
curl http://localhost:5500/health

# Check WebSocket endpoint
wscat -c ws://localhost:5500/v1/chat/stream
```

### No Audio
```bash
# Test TTS API directly
curl -X POST http://localhost:5500/v1/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"test","reference_id":"ナツメ"}'
```

Check:
- Browser console for errors
- Audio permissions
- TTS service is running

### Authorization Fails
- Check token matches backend configuration
- Check backend logs for auth errors
- Default token is `demo-token`

## 📖 Further Reading

1. **`INTEGRATION_GUIDE.md`** - Full architecture and integration details
2. **`QUICK_INTEGRATION.md`** - Step-by-step implementation
3. **`backend/docs/api/`** - Complete API documentation
4. **`backend/examples/`** - Working Python examples

## 🎉 What You Get

After integration:

✅ Live2D character on your desktop  
✅ Real-time streaming conversations  
✅ Natural voice with lip-sync  
✅ Image analysis (screenshots)  
✅ Conversation memory  
✅ Session management  
✅ Tool use capabilities  
✅ Emotion support (if enabled)  

## 🛠️ Next Steps

1. Review `QUICK_INTEGRATION.md` for implementation steps
2. Apply the code changes to your frontend
3. Test the basic flow
4. Customize voices and prompts
5. Add UI for settings
6. Implement session management UI
7. Add screenshot analysis feature
8. Polish and deploy!

## 💡 Tips

- Start with the basic chat flow first
- Test TTS separately before integrating
- Use browser DevTools to debug messages
- Check backend logs for errors
- Enable debug mode in config during development

## 📞 Support Resources

- Backend API docs: `backend/docs/api/README.md`
- C# Quick Reference: `backend/docs/api/CSharp_QuickReference.md`
- Python demo: `backend/examples/realtime_tts_streaming_demo.py`
- WebSocket API: `backend/docs/api/WebSocket_ChatStream.md`

---

**Ready to integrate?** Start with `QUICK_INTEGRATION.md` for step-by-step instructions!
