/**
 * src/renderer/src/services/api-service/stm.ts
 * Short-Term Memory (STM) API Service
 * Handles chat history and session management
 */

import { get, post, patch, del } from "./core";
import {
  ListSessionsResponseSchema,
  type ListSessionsResponse,
  ChatHistorySchema,
  type ChatHistory,
  AddChatHistoryRequestSchema,
  type AddChatHistoryRequest,
  AddChatHistoryResponseSchema,
  type AddChatHistoryResponse,
  UpdateSessionMetadataRequestSchema,
  type UpdateSessionMetadataRequest,
  UpdateSessionMetadataResponseSchema,
  type UpdateSessionMetadataResponse,
} from "../schemas/stm";

// ============================================================================
// Types
// ============================================================================

interface BaseSTMParams {
  user_id: string;
  agent_id: string;
  [key: string]: string | number | boolean | undefined;
}

interface SessionParams extends BaseSTMParams {
  session_id: string;
}

interface GetChatHistoryParams extends SessionParams {
  limit?: number;
}

interface AddChatHistoryParams extends BaseSTMParams {
  session_id?: string;
}

interface DeleteSessionResponse {
  message: string;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * List all chat sessions for a user and agent
 *
 * GET /stm/sessions
 *
 * @param params - User ID and agent ID
 * @returns Array of sessions with metadata
 *
 * @example
 * ```typescript
 * const sessions = await listSessions({
 *   user_id: 'user-123',
 *   agent_id: 'agent-456'
 * })
 * ```
 */
export async function listSessions(
  params: BaseSTMParams,
): Promise<ListSessionsResponse> {
  return get("/stm/sessions", { params }, ListSessionsResponseSchema);
}

/**
 * Get chat history for a specific session
 *
 * GET /stm/chat-history
 *
 * @param params - User ID, agent ID, session ID, and optional limit
 * @returns Chat history with messages
 *
 * @example
 * ```typescript
 * const history = await getChatHistory({
 *   user_id: 'user-123',
 *   agent_id: 'agent-456',
 *   session_id: 'abc123-def456-ghi789',
 *   limit: 50
 * })
 * ```
 */
export async function getChatHistory(
  params: GetChatHistoryParams,
): Promise<ChatHistory> {
  return get("/stm/chat-history", { params }, ChatHistorySchema);
}

/**
 * Add messages to a chat session's history
 * Creates a new session if session_id is not provided
 *
 * POST /stm/chat-history
 *
 * @param params - User ID, agent ID, and optional session ID
 * @param request - Messages to add
 * @returns Session ID and message count
 *
 * @example
 * ```typescript
 * const result = await addChatHistory(
 *   {
 *     user_id: 'user-123',
 *     agent_id: 'agent-456',
 *     session_id: 'abc123-def456-ghi789'
 *   },
 *   {
 *     messages: [
 *       { role: 'user', content: 'Hello!' },
 *       { role: 'assistant', content: 'Hi there!' }
 *     ]
 *   }
 * )
 * ```
 */
export async function addChatHistory(
  params: AddChatHistoryParams,
  request: AddChatHistoryRequest,
): Promise<AddChatHistoryResponse> {
  // Validate request body
  const validatedRequest = AddChatHistoryRequestSchema.parse(request);

  return post(
    "/stm/chat-history",
    validatedRequest,
    { params },
    AddChatHistoryResponseSchema,
  );
}

/**
 * Update metadata for a specific session
 *
 * PATCH /stm/sessions/{session_id}/metadata
 *
 * @param sessionId - Session ID
 * @param request - Metadata fields to update
 * @returns Success message
 *
 * @example
 * ```typescript
 * await updateSessionMetadata('abc123-def456-ghi789', {
 *   title: 'My Chat Session',
 *   user_id: 'user-789'
 * })
 * ```
 */
export async function updateSessionMetadata(
  sessionId: string,
  request: UpdateSessionMetadataRequest,
): Promise<UpdateSessionMetadataResponse> {
  // Validate request body
  const validatedRequest = UpdateSessionMetadataRequestSchema.parse(request);

  return patch(
    `/stm/sessions/${sessionId}/metadata`,
    validatedRequest,
    undefined,
    UpdateSessionMetadataResponseSchema,
  );
}

/**
 * Delete a chat session and its entire history
 * This action is irreversible
 *
 * DELETE /stm/sessions/{session_id}
 *
 * @param sessionId - Session ID
 * @param params - User ID and agent ID
 * @returns Success message
 *
 * @example
 * ```typescript
 * await deleteSession('abc123-def456-ghi789', {
 *   user_id: 'user-123',
 *   agent_id: 'agent-456'
 * })
 * ```
 */
export async function deleteSession(
  sessionId: string,
  params: BaseSTMParams,
): Promise<DeleteSessionResponse> {
  return del(`/stm/sessions/${sessionId}`, { params });
}
