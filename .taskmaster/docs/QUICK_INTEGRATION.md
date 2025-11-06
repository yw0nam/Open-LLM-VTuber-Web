# Quick Integration Steps

Follow these steps to connect Open-LLM-VTuber-Web to DesktopMatePlus backend.

## Step 1: Update WebSocket URLs

Edit `Open-LLM-VTuber-Web/src/renderer/src/context/websocket-context.tsx`:

```typescript
// Line 6-7: Change the default URLs
const DEFAULT_WS_URL = 'ws://127.0.0.1:5500/v1/chat/stream';
const DEFAULT_BASE_URL = 'http://127.0.0.1:5500';
```

## Step 2: Add Adapter to WebSocket Service

Edit `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-service.tsx`:

Add import at the top:
```typescript
import { desktopMateAdapter } from './desktopmate-adapter';
```

Update the `connect` method (around line 136):

```typescript
connect(url: string) {
  if (this.ws?.readyState === WebSocket.CONNECTING ||
      this.ws?.readyState === WebSocket.OPEN) {
    this.disconnect();
  }

  try {
    this.ws = new WebSocket(url);
    this.currentState = 'CONNECTING';
    this.stateSubject.next('CONNECTING');

    this.ws.onopen = () => {
      this.currentState = 'OPEN';
      this.stateSubject.next('OPEN');
      
      // Send authorization message for DesktopMate backend
      const authMsg = desktopMateAdapter.createAuthorizeMessage('demo-token');
      this.ws?.send(authMsg);
      console.log('Sent authorization to DesktopMate backend');
      
      // Original initialization
      this.initializeConnection();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle ping/pong for DesktopMate backend
        if (message.type === 'ping') {
          const pongMsg = desktopMateAdapter.createPongMessage();
          this.ws?.send(pongMsg);
          console.log('Sent pong response');
          return;
        }
        
        // Adapt backend message to frontend format
        const adaptedMessage = desktopMateAdapter.adaptMessage(message);
        if (adaptedMessage) {
          this.messageSubject.next(adaptedMessage);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        toaster.create({
          title: `${getTranslation()('error.failedParseWebSocket')}: ${error}`,
          type: "error",
          duration: 2000,
        });
      }
    };

    // ... rest of the method stays the same
```

## Step 3: Update Message Sending

In the same file, update the `sendMessage` method to convert frontend messages to backend format:

```typescript
sendMessage(message: object) {
  if (this.ws?.readyState === WebSocket.OPEN) {
    // Check if this is a text message from the user
    if ((message as any).type === 'send-message' || (message as any).type === 'user-input') {
      const text = (message as any).text || (message as any).content;
      if (text) {
        // Convert to DesktopMate format
        const chatMsg = desktopMateAdapter.createChatMessage(text);
        this.ws.send(chatMsg);
        console.log('Sent chat message to backend:', text);
        return;
      }
    }
    
    // For other message types, send as-is
    this.ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket is not open. Unable to send message:', message);
    toaster.create({
      title: getTranslation()('error.websocketNotOpen'),
      type: 'error',
      duration: 2000,
    });
  }
}
```

## Step 4: Handle TTS in WebSocket Handler

Edit `Open-LLM-VTuber-Web/src/renderer/src/services/websocket-handler.tsx`:

Add import at the top:
```typescript
import { desktopMateAdapter } from './desktopmate-adapter';
```

In the `handleWebSocketMessage` callback (around line 94), add a case for TTS handling:

```typescript
const handleWebSocketMessage = useCallback((message: MessageEvent) => {
  console.log('Received message from server:', message);
  
  switch (message.type) {
    // ... existing cases ...
    
    case 'text':
      // Check if this message needs TTS
      if ((message as any)._needs_tts) {
        const chunk = message.content;
        const emotion = (message as any)._emotion;
        
        // Call TTS API asynchronously
        desktopMateAdapter.synthesizeSpeech(chunk, 'ナツメ').then(async (audioBase64) => {
          if (audioBase64) {
            // Extract volumes for lip-sync
            const volumes = await desktopMateAdapter.extractVolumes(audioBase64);
            
            // Add to audio task queue
            addAudioTask({
              type: 'audio',
              audio: audioBase64,
              volumes: volumes,
              slice_length: volumes.length,
              display_text: {
                text: chunk,
                name: 'AI',
                avatar: '',
              },
            });
          }
        }).catch((error) => {
          console.error('TTS synthesis failed:', error);
        });
      }
      
      // Also display the text
      setSubtitleText(message.content);
      break;
    
    // ... rest of the cases ...
  }
}, [/* dependencies */]);
```

## Step 5: Update Base URL in Adapter

In `websocket-context.tsx`, update the adapter when baseUrl changes:

```typescript
const handleSetBaseUrl = useCallback((url: string) => {
  setBaseUrl(url);
  desktopMateAdapter.setBaseUrl(url);
}, [setBaseUrl]);
```

And in the `WebSocketProvider`, initialize the adapter:

```typescript
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [wsUrl, setWsUrl] = useLocalStorage('wsUrl', DEFAULT_WS_URL);
  const [baseUrl, setBaseUrl] = useLocalStorage('baseUrl', DEFAULT_BASE_URL);
  
  // Initialize adapter with base URL
  React.useEffect(() => {
    desktopMateAdapter.setBaseUrl(baseUrl);
  }, [baseUrl]);
  
  // ... rest of the provider ...
}
```

## Step 6: Test the Integration

### 6.1 Start Backend

```bash
cd backend
python -m src.main
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5500 (Press CTRL+C to quit)
```

### 6.2 Test Backend Health

```bash
curl http://localhost:5500/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T11:37:27.690788",
  "modules": [
    {
      "name": "VLM",
      "ready": true,
      "error": null
    },
    {
      "name": "TTS",
      "ready": true,
      "error": null
    },
    {
      "name": "Agent",
      "ready": true,
      "error": null
    },
    {
      "name": "LTM",
      "ready": true,
      "error": null
    },
    {
      "name": "STM",
      "ready": true,
      "error": null
    }
  ]
}
```

### 6.3 Start Frontend

```bash
cd Open-LLM-VTuber-Web
npm install  # If you haven't already
npm run dev
```

### 6.4 Test the Flow

1. Open the application
2. The WebSocket should connect automatically
```bash
cd Open-LLM-VTuber-Web
npm install  # If you haven't already
npm run dev
```

### 6.4 Test the Flow

1. Open the application
2. The WebSocket should connect automatically
3. Check browser console for:
   - "Sent authorization to DesktopMate backend"
   - "✅ Authorization successful: [connection_id]"
4. Type a message and send
5. You should see:
   - Message appears in chat
   - Backend starts streaming
   - TTS chunks are received
   - Audio is synthesized
   - Character speaks with lip-sync

## Troubleshooting

### Issue: Authorization Failed

**Symptoms:** No response after connecting

**Fix:** Check backend logs. The default token is `demo-token`. If you changed it in the backend, update it in the adapter:

```typescript
const authMsg = desktopMateAdapter.createAuthorizeMessage('your-token-here');
```

### Issue: No Audio

**Symptoms:** Messages work but no voice

**Fix:** 
1. Check TTS service is available:
   ```bash
   curl -X POST http://localhost:5500/v1/tts/synthesize \
     -H "Content-Type: application/json" \
     -d '{"text":"test","reference_id":"ナツメ"}'
   ```

2. Check browser console for TTS errors

3. Verify the reference voice exists in backend

### Issue: WebSocket Disconnects

**Symptoms:** Connection drops after a few seconds

**Fix:** Make sure ping/pong is working. Check console for "Sent pong response" messages.

### Issue: Messages Not Sending

**Symptoms:** Type message but nothing happens

**Fix:** Check the message type conversion in `sendMessage`. The frontend might be using a different message type. Add logging:

```typescript
console.log('Original message:', message);
console.log('Converted message:', chatMsg);
```

## Optional Enhancements

### Add Voice Selection UI

Create a settings panel to choose different voices:

```typescript
const [selectedVoice, setSelectedVoice] = useState('ナツメ');

// When synthesizing:
desktopMateAdapter.synthesizeSpeech(chunk, selectedVoice);
```

### Add Session Management

Use the STM API to persist conversations:

```typescript
// List sessions
const response = await fetch(`${baseUrl}/v1/stm/sessions?user_id=user1&agent_id=agent1`);
const sessions = await response.json();

// Get chat history
const history = await fetch(`${baseUrl}/v1/stm/chat-history?session_id=${sessionId}`);
```

### Add Screenshot Analysis

Use the VLM API to analyze screenshots:

```typescript
// Capture screenshot
const screenshot = await captureScreen();

// Analyze with VLM
const description = await desktopMateAdapter.analyzeImage(
  screenshot,
  'What is on the screen?'
);

// Send as context with next message
const chatMsg = desktopMateAdapter.createChatMessage(
  `User asks: What do you see?\n\nScreen content: ${description}`
);
```

## Complete Example Flow

Here's what happens when a user sends "Hello":

```
1. User types "Hello" and clicks send
   ↓
2. Frontend: sendMessage({ type: 'send-message', text: 'Hello' })
   ↓
3. Adapter: Converts to { type: 'chat_message', messages: [{ type: 'human', content: 'Hello' }] }
   ↓
4. Backend: Receives chat_message, starts processing
   ↓
5. Backend: Sends { type: 'stream_start' }
   ↓
6. Adapter: Converts to { type: 'control', text: 'conversation-chain-start' }
   ↓
7. Frontend: Clears previous response, shows "thinking" state
   ↓
8. Backend: Generates "Hello! How can I help you today?"
   ↓
9. Backend: Detects sentence "Hello!"
   ↓
10. Backend: Sends { type: 'tts_ready_chunk', chunk: 'Hello!', sentence_index: 0 }
    ↓
11. Adapter: Converts to { type: 'text', content: 'Hello!', _needs_tts: true }
    ↓
12. Frontend: Calls synthesizeSpeech('Hello!')
    ↓
13. TTS API: Returns base64 audio
    ↓
14. Frontend: Extracts volumes for lip-sync
    ↓
15. Frontend: Adds to audio queue → Character speaks "Hello!"
    ↓
16. Backend: Continues with next sentence...
    ↓
17. Backend: Sends { type: 'stream_end', full_response: '...' }
    ↓
18. Adapter: Converts to { type: 'control', text: 'conversation-chain-end' }
    ↓
19. Frontend: Shows "idle" state, conversation complete
```

## Next Steps

1. ✅ Basic integration working
2. Test with different message types
3. Add error recovery
4. Implement session persistence
5. Add screenshot analysis feature
6. Customize voices and prompts
7. Add settings UI
8. Performance optimization
9. Production deployment

## Support

- Backend API docs: `backend/docs/api/`
- Python examples: `backend/examples/`
- Main integration guide: `INTEGRATION_GUIDE.md`

Enjoy your integrated DesktopMate+ with Live2D! 🎉
