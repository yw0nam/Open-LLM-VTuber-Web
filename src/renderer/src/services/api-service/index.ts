/**
 * API Service - Central export for all API modules
 *
 * This module provides a unified interface for making HTTP requests to the backend.
 *
 * @example
 * ```typescript
 * import { stmAPI, ttsAPI, vlmAPI, setBaseURL } from '@/services/api-service'
 *
 * // Configure base URL
 * setBaseURL('http://localhost:5500/api/v1')
 *
 * // Use STM API
 * const sessions = await stmAPI.listSessions({ user_id: '123', agent_id: '456' })
 *
 * // Use TTS API
 * const audio = await ttsAPI.synthesizeSpeech({ text: 'Hello!' })
 *
 * // Use VLM API
 * const analysis = await vlmAPI.analyzeImage({ image: file, prompt: 'What is this?' })
 * ```
 */

// Core utilities
export { setBaseURL, getBaseURL, APIError } from "./core";
export type { RequestOptions } from "./core";

// STM API
import * as stmAPI from "./stm";
export { stmAPI };
export type {
  ListSessionsResponse,
  Session,
  SessionMetadata,
  ChatHistory,
  ChatMessage,
  AddChatHistoryRequest,
  AddChatHistoryResponse,
  UpdateSessionMetadataRequest,
  UpdateSessionMetadataResponse,
} from "../schemas/stm";

// TTS API
import * as ttsAPI from "./tts";
export { ttsAPI };
export type {
  TTSSynthesizeRequest,
  TTSSynthesizeResponse,
} from "../schemas/tts";

// VLM API
import * as vlmAPI from "./vlm";
export { vlmAPI };
export type { VLMAnalyzeRequest, VLMAnalyzeResponse } from "../schemas/vlm";
