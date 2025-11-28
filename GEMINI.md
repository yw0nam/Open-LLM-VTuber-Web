# GEMINI.md

This file provides guidance to GEMINI Code when working with code in this repository.

Note, this implementation should be modifed. this is just a starting point.
The backend is replaced by my backend. and there is a lot of unnecessary code in this repo.
See the Integration with Backend section below for more details.

## Development Commands

### Install dependencies

```bash
npm install
```

### Run development server

```bash
npm run dev        # Run Electron app in dev mode
npm run dev:web    # Run web-only version
```

### Build commands

```bash
npm run build:win     # Build for Windows
npm run build:mac     # Build for macOS
npm run build:linux   # Build for Linux
npm run build:web     # Build web version
```

### Code quality

```bash
npm run format        # Format code with Prettier
```

### Translation extraction

```bash
npm run extract-translations  # Extract i18n strings
```

## Architecture Overview

This is an Electron + React application for an AI VTuber system with Live2D integration. The architecture consists of:

### Main Process (`src/main/`)

- **index.ts**: Entry point, sets up IPC handlers for window management, mouse events, and screen capture
- **window-manager.ts**: Manages window state, modes (window/pet), and window properties
- **menu-manager.ts**: Handles system tray and context menus

### Renderer Process (`src/renderer/src/`)

- **App.tsx**: Root component that sets up providers and renders the main layout
- **Two display modes**:
  - **Window mode**: Full UI with sidebar, footer, and Live2D canvas
  - **Pet mode**: Minimal overlay with just Live2D and input subtitle

### Core Services

- **WebSocket Handler** (`services/websocket-handler.tsx`): Central communication hub that:
  - Manages WebSocket connection to backend server
  - Handles incoming messages (audio, control, model updates, chat history)
  - Coordinates state updates across multiple contexts
  - Manages audio playback queue

### Context Providers (State Management)

The app uses React Context for state management with multiple specialized contexts:

- **AiStateContext**: AI conversation state (idle, thinking, speaking, listening)
- **Live2DConfigContext**: Live2D model configuration and loading
- **ChatHistoryContext**: Conversation history and messages
- **VADContext**: Voice Activity Detection for microphone control
- **WebSocketContext**: WebSocket connection state and messaging
- **SubtitleContext**: Subtitle display management
- **GroupContext**: Multi-user group session management

### Live2D Integration

- Uses Cubism SDK (WebSDK folder) for Live2D model rendering
- **live2d.tsx**: Main Live2D component handling model loading, animation, and lip sync
- Supports model switching, expressions, and motion playback
- Audio-driven lip sync with volume-based animation

### Key Features

- Real-time voice interaction with VAD (Voice Activity Detection)
- WebSocket-based communication with backend AI server
- Live2D character animation with expressions and lip sync
- Multi-language support (i18n)
- Group/collaborative sessions
- Screen capture support
- Customizable backgrounds and UI themes

## Important Notes

- The app requires a backend server connection (WebSocket) for AI functionality
- Live2D models are loaded from URLs provided by the backend
- Audio is streamed as base64-encoded data with volume arrays for lip sync
- The app uses Chakra UI v3 for the component library
- ESLint is configured with relaxed rules (many checks disabled in .eslintrc.js)

## Integration with Backend

### Modules that should be removed

- browser-context [Done]
- group-context [Done]

### Modules that should be implemented

- src/renderer/src/services/api-service/ [Done]
  ├── core.ts # fetch 래퍼, Base URL, 공통 헤더 설정 [Done]
  ├── stm.ts # Short-Term Memory 관련 API 모음 [Done]
  ├── tts.ts # Text-to-Speech 관련 API 모음 [Done]
  └── vlm.ts # Vision Model 관련 API 모음 [Done]
- src/renderer/src/services/schemas/ [Done]
  └── stm.ts # STM 관련 zod 스키마 [Done]
  └── tts.ts # TTS 관련 zod 스키마 [Done]
  └── vlm.ts # vlm 관련 zod 스키마 [Done]
  └── websocket.ts # websocket 관련 zod 스키마 [Done]

### Modules that should be modified

- src/renderer/src/services/websocket-service/ : For matching current backend websocket API
├── client.ts        # (1) 저수준 연결 (기존 wsService 역할)
└── websocket-handlers.tsx # (3) React 관제탑 (Context .tsx)
└── websocket-handlers-regacy.tsx # (3) 기존 WebSocketHandler (제거 예정, implement끝나기 전까지는 reference로 유지)
├── handlers      # (2) 메시지 처리 로직 (순수 .ts) 
└─────handleTTSReadyChunk.ts  # TTS 준비 청크 처리 [ Done ]
└─────index.ts                  # 핸들러 모음
└─────...
- src/renderer/src/context
├── chat-history-context.tsx  # For managing chat history state [Done]
├── websocket-context.tsx   # For managing WebSocket state [Done]
├── ...
- src/renderer/src/hooks
- src/renderer/src/components


## WebSocket Service Architecture

```
User sends message
    ↓
FE: Optimistic UI update (addUserMessageToUI)
    ↓
FE: Send via WebSocket
    ↓
Backend: Retrieves LTM + STM → Feeds to agent
    ↓
Backend: Streams events (stream_token, tts_ready_chunk, etc.)
    ↓
FE: Updates UI in real-time
    ↓
Backend: On stream_end → Saves to STM + LTM automatically
    ↓
✅ No FE API calls needed for persistence!
```