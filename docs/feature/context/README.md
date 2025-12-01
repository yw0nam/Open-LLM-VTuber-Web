# Context Providers

Updated: 2025-11-28

## Overview

React Context providers for global state management.

## Module Index

| Module | File | Description |
|--------|------|-------------|
| [AI State](./ai-state.md) | `ai-state-context.tsx` | AI state machine |
| [WebSocket](./websocket.md) | `websocket-context.tsx` | WS connection state |
| [Chat History](./chat-history.md) | `chat-history-context.tsx` | Sessions and messages |
| [Live2D Config](./live2d-config.md) | `live2d-config-context.tsx` | Model configuration |
| [VAD](./vad.md) | `vad-context.tsx` | Voice Activity Detection |
| [Mode](./mode.md) | `mode-context.tsx` | Window/Pet mode |
| [Others](./others.md) | Various | Subtitle, background, camera, etc. |

## Provider Hierarchy

```text
ModeProvider
└─ CameraProvider
   └─ ScreenCaptureProvider
      └─ CharacterConfigProvider
         └─ ChatHistoryProvider
            └─ AiStateProvider
               └─ ProactiveSpeakProvider
                  └─ Live2DConfigProvider
                     └─ SubtitleProvider
                        └─ VADProvider
                           └─ WebSocketProvider
                              └─ BgUrlProvider
                                 └─ WebSocketHandlerProvider
```

## Quick Reference

### Core Contexts

| Hook | Returns |
|------|---------|
| `useAiState()` | `aiState`, `setAiState`, state helpers |
| `useWebSocket()` | `wsState`, `sendMessage`, `reconnect` |
| `useChatHistory()` | `messages`, `selectSession`, streaming methods |
| `useLive2DConfig()` | `modelPath`, `modelInfo` |
| `useVad()` | `vadEnabled`, `vadStatus` |
| `useMode()` | `mode`, `setMode` |

### Utility Contexts

| Hook | Returns |
|------|---------|
| `useSubtitle()` | `subtitleText`, `isSubtitleVisible` |
| `useBgUrl()` | `bgUrl`, `setBgUrl` |
| `useCamera()` | `cameraStream`, `startCamera`, `stopCamera` |
| `useScreenCapture()` | `captureStream`, `startCapture` |
| `useCharacterConfig()` | `agentId`, `userId`, `configFiles` |
| `useProactiveSpeak()` | `enabled`, `interval` |

## Related Documents

- [Components](../component/README.md)
- [Hooks](../hook/README.md)

