# API Service

This directory contains the REST API client for communicating with the DesktopMatePlus backend.

## Architecture

```
api-service/
├── core.ts          # HTTP client wrapper with error handling
├── stm.ts           # Short-Term Memory API methods
├── tts.ts           # Text-to-Speech API methods
├── vlm.ts           # Vision Language Model API methods
└── index.ts         # Barrel export for all services
```

## Features

- **Type-safe**: Full TypeScript support with Zod schema validation
- **Error handling**: Custom `APIError` class with status codes and response data
- **Flexible configuration**: Configurable base URL
- **Query parameters**: Automatic URL encoding of query parameters
- **Request validation**: Validates request bodies against schemas
- **Response validation**: Validates response data against schemas

## Usage

### Configuration

```typescript
import { setBaseURL } from "@/services/api-service";

// Set the base URL for all API requests (optional, defaults to http://127.0.0.1:5500/api/v1)
setBaseURL("http://localhost:5500/v1");
```

### Short-Term Memory (STM) API

```typescript
import { stmAPI } from "@/services/api-service";

// List all sessions
const sessions = await stmAPI.listSessions({
  user_id: "user-123",
  agent_id: "agent-456",
});

// Get chat history
const history = await stmAPI.getChatHistory({
  user_id: "user-123",
  agent_id: "agent-456",
  session_id: "abc123-def456-ghi789",
  limit: 50, // optional
});

// Add messages to chat history
const result = await stmAPI.addChatHistory(
  {
    user_id: "user-123",
    agent_id: "agent-456",
    session_id: "abc123-def456-ghi789", // optional, creates new session if omitted
  },
  {
    messages: [
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "Hi there!" },
    ],
  },
);

// Update session metadata
await stmAPI.updateSessionMetadata("abc123-def456-ghi789", {
  title: "My Chat Session",
  user_id: "user-789",
});

// Delete session
await stmAPI.deleteSession("abc123-def456-ghi789", {
  user_id: "user-123",
  agent_id: "agent-456",
});
```

### Text-to-Speech (TTS) API

```typescript
import { ttsAPI } from "@/services/api-service";

// Synthesize speech
const result = await ttsAPI.synthesizeSpeech({
  text: "Hello, world!",
  output_format: "base64", // optional, defaults to 'base64'
});

// With voice cloning
const result = await ttsAPI.synthesizeSpeech({
  text: "Hello in custom voice!",
  reference_id: "voice-id-123",
  output_format: "base64",
});

console.log(result.audio_data); // base64 encoded audio
```

### Vision Language Model (VLM) API

```typescript
import { vlmAPI } from "@/services/api-service";

// Analyze image with prompt
const result = await vlmAPI.analyzeImage({
  image: imageFile, // File or Blob
  prompt: "What do you see in this image?",
});

// General image description
const result = await vlmAPI.analyzeImage({
  image: imageFile,
});

console.log(result.analysis); // text description
```

## Error Handling

All API methods throw `APIError` on failure:

```typescript
import { stmAPI, APIError } from "@/services/api-service";

try {
  const sessions = await stmAPI.listSessions({
    user_id: "user-123",
    agent_id: "agent-456",
  });
} catch (error) {
  if (error instanceof APIError) {
    console.error("API Error:", error.message);
    console.error("Status:", error.status);
    console.error("Response:", error.response);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Core HTTP Methods

The `core.ts` module provides low-level HTTP methods:

```typescript
import {
  get,
  post,
  patch,
  del,
  postFormData,
} from "@/services/api-service/core";

// GET request
const data = await get("/path", { params: { key: "value" } }, schema);

// POST request with JSON body
const data = await post("/path", body, options, schema);

// PATCH request
const data = await patch("/path", body, options, schema);

// DELETE request
const data = await del("/path", options, schema);

// POST request with FormData
const data = await postFormData("/path", formData, options, schema);
```

## Type Exports

All request/response types are exported from the main index:

```typescript
import type {
  // STM types
  ListSessionsResponse,
  Session,
  SessionMetadata,
  ChatHistory,
  ChatMessage,
  AddChatHistoryRequest,
  AddChatHistoryResponse,
  UpdateSessionMetadataRequest,
  UpdateSessionMetadataResponse,

  // TTS types
  TTSSynthesizeRequest,
  TTSSynthesizeResponse,

  // VLM types
  VLMAnalyzeRequest,
  VLMAnalyzeResponse,
} from "@/services/api-service";
```

## Backend API Documentation

For detailed backend API specifications, see:

- [REST API Guide](../../../../../backend/docs/api/REST_API_GUIDE.md)
- [STM API Docs](../../../../../backend/docs/api/STM_*.md)
- [TTS API Docs](../../../../../backend/docs/api/TTS_*.md)
- [VLM API Docs](../../../../../backend/docs/api/VLM_*.md)
