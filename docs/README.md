# Open-LLM-VTuber-Web Documentation

Updated: 2025-11-28

## Overview

Electron + React application for AI VTuber with Live2D integration. Supports Window and Pet display modes with real-time AI interactions via WebSocket.

## Documentation Index

### Core Modules

| Module | Path | Description |
|--------|------|-------------|
| [Main Process](./main/README.md) | `src/main/` | Electron main process, window management, IPC |
| [Preload Scripts](./preload/README.md) | `src/preload/` | Context bridge, `window.api` interface |
| [Utilities](./utils/README.md) | `src/renderer/src/utils/` | Audio manager, task queue |

### Feature Modules

| Module | Path | Description |
|--------|------|-------------|
| [Components](./feature/component/README.md) | `src/renderer/src/components/` | React UI components (index) |
| ↳ [Canvas](./feature/component/canvas.md) | `components/canvas/` | Live2D, background, subtitle |
| ↳ [Sidebar](./feature/component/sidebar.md) | `components/sidebar/` | Chat history, settings |
| ↳ [Footer](./feature/component/footer.md) | `components/footer/` | Input controls |
| ↳ [Electron](./feature/component/electron.md) | `components/electron/` | Title bar, pet mode |
| ↳ [UI](./feature/component/ui.md) | `components/ui/` | Chakra wrappers |
| [Context Providers](./feature/context/README.md) | `src/renderer/src/context/` | Global state management (index) |
| ↳ [AI State](./feature/context/ai-state.md) | `ai-state-context.tsx` | AI state machine |
| ↳ [WebSocket](./feature/context/websocket.md) | `websocket-context.tsx` | WS connection |
| ↳ [Chat History](./feature/context/chat-history.md) | `chat-history-context.tsx` | Messages |
| ↳ [Others](./feature/context/others.md) | Various | Subtitle, camera, etc. |
| [Custom Hooks](./feature/hook/README.md) | `src/renderer/src/hooks/` | Reusable React hooks (index) |
| ↳ [Canvas](./feature/hook/canvas.md) | `hooks/canvas/` | Live2D hooks |
| ↳ [Footer](./feature/hook/footer.md) | `hooks/footer/` | Input hooks |
| ↳ [Sidebar](./feature/hook/sidebar.md) | `hooks/sidebar/` | Sidebar hooks |
| ↳ [Utils](./feature/hook/utils.md) | `hooks/utils/` | Utility hooks |
| ↳ [Electron](./feature/hook/electron.md) | `hooks/electron/` | Electron hooks |
| [Services](./feature/service/README.md) | `src/renderer/src/services/` | API & WebSocket clients (index) |
| ↳ [API Overview](./feature/service/api-README.md) | `api-service/` | HTTP API client |
| ↳ [STM API](./feature/service/api-stm.md) | `api-service/stm.ts` | Session & chat history |
| ↳ [TTS API](./feature/service/api-tts.md) | `api-service/tts.ts` | Text-to-speech |
| ↳ [VLM API](./feature/service/api-vlm.md) | `api-service/vlm.ts` | Vision-language model |
| ↳ [WebSocket Overview](./feature/service/ws-README.md) | `websocket-service/` | WebSocket client |
| ↳ [Client Messages](./feature/service/ws-client-messages.md) | Messages | Client-to-server |
| ↳ [Server Messages](./feature/service/ws-server-messages.md) | Messages | Server-to-client |
| ↳ [Message Flows](./feature/service/ws-message-flows.md) | Flows | Common patterns |
| [Types](./feature/types/README.md) | `src/renderer/src/types/` | TypeScript definitions |

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build for production
npm run build
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ index.ts    │ │ window-mgr  │ │ menu-manager        │   │
│  │ (IPC setup) │ │ (modes)     │ │ (tray/context menu) │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │ IPC
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Preload Scripts                           │
│                    (window.api bridge)                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Renderer                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Context Providers (nested)                │ │
│  │  Mode → Camera → Screen → Character → Chat → AI →     │ │
│  │  Proactive → Live2D → Subtitle → VAD → WS → Bg        │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Components  │ │ Hooks       │ │ Services            │   │
│  │ - Canvas    │ │ - Canvas    │ │ - API Service       │   │
│  │ - Sidebar   │ │ - Footer    │ │ - WebSocket Service │   │
│  │ - Footer    │ │ - Sidebar   │ │ - Schemas           │   │
│  │ - Electron  │ │ - Utils     │ │                     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │ WebSocket / HTTP
                           ▼
                    ┌─────────────┐
                    │   Backend   │
                    │   Server    │
                    └─────────────┘
```

## Document Guide

See [DOCUMENT_GUIDE.md](./DOCUMENT_GUIDE.md) for documentation authoring standards.
