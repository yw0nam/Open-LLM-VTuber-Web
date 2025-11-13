# Implement Rule


## api-service.tsx

You can find more details about REST API in [REST API Guide](../../../../../backend/docs/api/REST_API_GUIDE.md).

- Implement HTTP API

- **[List Sessions](../../../../../backend/docs/api/STM_ListSessions.md)**: `GET /stm/sessions`
- **[Get Chat History](../../../../../backend/docs/api/STM_GetChatHistory.md)**: `GET /stm/sessions/{session_id}`
- **[Add Chat History](../../../../../backend/docs/api/STM_AddChatHistory.md)**: `POST /stm/sessions/{session_id}/history`
- **[Update Session Metadata](../../../../../backend/docs/api/STM_UpdateSessionMetadata.md)**: `PUT /stm/sessions/{session_id}/metadata`
- **[Delete Session](../../../../../backend/docs/api/STM_DeleteSession.md)**: `DELETE /stm/sessions/{session_id}`
- **[Synthesize Speech](../../../../../backend/docs/api/TTS_Synthesize.md)**: `POST /tts/synthesize`
- **[Analyze Image](../../../../../backend/docs/api/VLM_Analyze.md)**: `POST /vlm/analyze`

## websocket-service.tsx

Implement Websocket logic.

You can find more details about WebSocket API in [WebSocket API Guide](../../../../../backend/docs/api/WEBSOCKET_API_GUIDE.md).

### Client-to-Server Messages

- **[Authorize](../../../../../backend/docs/api/WebSocket_Authorize.md)**: Authenticate the connection.
- **[Pong](../../../../../backend/docs/api/WebSocket_Pong.md)**: Response to server ping for heartbeat.
- **[Chat Message](../../../../../backend/docs/api/WebSocket_ChatMessage.md)**: Send a user's message to the agent.
- **[Interrupt Stream](../../../../../backend/docs/api/WebSocket_InterruptStream.md)**: Interrupt an active response stream.

### Server-to-Client Messages

- **[Authorize Success](../../../../../backend/docs/api/WebSocket_AuthorizeSuccess.md)**: Confirms successful connection and authorization.
- **[Authorize Error](../../../../../backend/docs/api/WebSocket_AuthorizeError.md)**: Indicates authorization failure.
- **[Ping](../../../../../backend/docs/api/WebSocket_Ping.md)**: Heartbeat message from server.
- **[Stream Start](../../../../../backend/docs/api/WebSocket_StreamStart.md)**: Signals the beginning of an agent's response turn.
- **[Stream Token](../../../../../backend/docs/api/WebSocket_StreamToken.md)**: A piece of the agent's text response.
- **[Stream End](../../../../../backend/docs/api/WebSocket_StreamEnd.md)**: Signals the end of an agent's response turn.
- **[TTS Ready Chunk](../../../../../backend/docs/api/WebSocket_TTSReadyChunk.md)**: A chunk of text ready for TTS synthesis.
- **[Tool Call](../../../../../backend/docs/api/WebSocket_ToolCall.md)**: Informs the client that the agent is using a tool.
- **[Tool Result](../../../../../backend/docs/api/WebSocket_ToolResult.md)**: Provides the result of a tool's execution.
- **[Error Message](../../../../../backend/docs/api/WebSocket_ErrorMessage.md)**: Sent when an error occurs.

## websocket-handler.tsx

- Integrate API service and WebSocket service
- Manage state updates across contexts
- Handle incoming websocket message types
- Manage audio playback queue