/**
 * DesktopMate Adapter
 *
 * Protocol translation layer between DesktopMate backend and frontend.
 * Converts messages between backend and frontend formats and provides
 * convenient methods for creating protocol-compliant requests.
 */

import { configManager } from "./desktopmate-config";
import { debugLog, errorLog } from "./logger";
import {
  WebSocketMessage,
  ServerMessage,
  AuthorizeMessage,
  ChatMessage,
  PongMessage,
  MessageType,
} from "./message-types";
import {
  TTSRequest,
  TTSResponse,
  VLMRequest,
  VLMResponse,
  AddChatHistoryRequest,
  AddChatHistoryResponse,
  GetChatHistoryRequest,
  GetChatHistoryResponse,
  ListSessionsRequest,
  ListSessionsResponse,
  DeleteSessionRequest,
  DeleteSessionResponse,
  UpdateSessionMetadataRequest,
  UpdateSessionMetadataResponse,
} from "./config-types";
import { extractVolumesFromWAV } from "./audio-processor";
import { MessageValidator } from "./message-validator";

/**
 * Result of message adaptation from backend to frontend format
 */
export interface AdaptedMessage {
  type: string;
  data: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Context for chat messages
 */
export interface ChatContext {
  agentId: string;
  userId: string;
  conversationId?: string;
  persona?: string;
  images?: string[];
  limit?: number;
  metadata?: Record<string, unknown>;
}

/**
 * DesktopMate Protocol Adapter
 *
 * Handles bidirectional message translation and provides utilities
 * for creating protocol-compliant messages and requests.
 */
export class DesktopMateAdapter {
  /**
   * Adapts a backend message to frontend format
   *
   * @param backendMsg - Message received from backend
   * @returns Adapted message in frontend format
   */
  adaptMessage(backendMsg: ServerMessage): AdaptedMessage {
    try {
      // Validate and sanitize the message first
      const validationResult = MessageValidator.validateServerMessage(backendMsg);
      
      if (!validationResult.valid) {
        errorLog(
          "desktopmate-adapter",
          "Message validation failed",
          new Error(`Validation errors: ${validationResult.errors.join(', ')}`),
        );
        
        // Return an error adapted message for invalid input
        return {
          type: "error",
          data: {
            message: "Invalid message format received from server",
            code: "VALIDATION_ERROR",
            details: validationResult.errors,
          },
          metadata: {
            timestamp: Date.now(),
            originalMessage: backendMsg,
          },
        };
      }

      // Use the sanitized message for further processing
      const sanitizedMsg = validationResult.sanitized || backendMsg;
      
      debugLog("desktopmate-adapter", "Adapting backend message", {
        type: sanitizedMsg.type,
      });
      
      // Extract common fields
      const timestamp = sanitizedMsg.timestamp;

      // Pattern matching on message type
      switch (sanitizedMsg.type) {
        case MessageType.PING:
          return {
            type: "ping",
            data: {},
            metadata: { timestamp },
          };

        case MessageType.AUTHORIZE_SUCCESS:
          return {
            type: "authorize_success",
            data: {
              connection_id: (sanitizedMsg as any).connection_id,
            },
            metadata: { timestamp },
          };

        case MessageType.AUTHORIZE_ERROR:
          return {
            type: "authorize_error",
            data: {
              error: (sanitizedMsg as any).error,
            },
            metadata: { timestamp },
          };

        case MessageType.CHAT_RESPONSE:
          return {
            type: "chat_response",
            data: {
              content: (sanitizedMsg as any).content,
              metadata: (sanitizedMsg as any).metadata,
            },
            metadata: { timestamp },
          };

        case MessageType.STREAM_TOKEN:
          return {
            type: "stream_token",
            data: {
              token: (sanitizedMsg as any).token,
              turn_id: (sanitizedMsg as any).turn_id,
            },
            metadata: { timestamp },
          };

        case MessageType.TTS_READY_CHUNK:
          return {
            type: "tts_ready_chunk",
            data: {
              audio_chunk: (sanitizedMsg as any).audio_chunk,
              chunk_index: (sanitizedMsg as any).chunk_index,
              total_chunks: (sanitizedMsg as any).total_chunks,
            },
            metadata: { timestamp },
          };

        case MessageType.ERROR:
          return {
            type: "error",
            data: {
              message: (sanitizedMsg as any).message,
              code: (sanitizedMsg as any).code,
            },
            metadata: { timestamp },
          };

        default:
          // Handle unknown message types gracefully
          errorLog(
            "desktopmate-adapter",
            "Unknown message type received",
            new Error(`Unknown type: ${(sanitizedMsg as WebSocketMessage).type}`),
          );
          return {
            type: "unknown",
            data: sanitizedMsg,
            metadata: {
              originalType: (sanitizedMsg as WebSocketMessage).type,
              timestamp,
            },
          };
      }
    } catch (error) {
      errorLog(
        "desktopmate-adapter",
        "Failed to adapt message",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Creates an authorization message
   *
   * @param token - Authorization token
   * @returns Protocol-compliant authorization message
   */
  createAuthorizeMessage(token: string): AuthorizeMessage {
    debugLog("desktopmate-adapter", "Creating authorize message");

    return {
      type: MessageType.AUTHORIZE,
      token,
      timestamp: Date.now(),
    };
  }

  /**
   * Creates a chat message
   *
   * @param text - Message text
   * @param context - Required conversation context (agentId and userId are mandatory)
   * @returns Protocol-compliant chat message
   */
  createChatMessage(text: string, context: ChatContext): ChatMessage {
    debugLog("desktopmate-adapter", "Creating chat message", {
      textLength: text.length,
      hasContext: !!context,
    });

    return {
      type: MessageType.CHAT_MESSAGE,
      content: text,
      agent_id: context.agentId,
      user_id: context.userId,
      persona: context.persona,
      images: context.images,
      limit: context.limit,
      conversation_id: context.conversationId,
      timestamp: Date.now(),
      metadata: context.metadata,
    };
  } /**
   * Creates a pong message (response to ping)
   *
   * @returns Protocol-compliant pong message
   */
  createPongMessage(): PongMessage {
    debugLog("desktopmate-adapter", "Creating pong message");

    return {
      type: MessageType.PONG,
      timestamp: Date.now(),
    };
  }

  /**
   * Synthesizes speech from text using TTS service
   *
   * @param text - Text to synthesize
   * @param referenceId - Voice reference ID (optional, uses config default)
   * @param timeout - Request timeout in milliseconds (default: 30000)
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Promise resolving to TTS response
   */
  async synthesizeSpeech(
    text: string,
    referenceId?: string,
    timeout: number = 30000,
    maxRetries: number = 3,
  ): Promise<TTSResponse> {
    // Input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      const error = new Error('Text must be a non-empty string');
      errorLog("desktopmate-adapter", "Invalid input: text", error);
      throw error;
    }

    if (referenceId !== undefined && (typeof referenceId !== 'string' || referenceId.trim().length === 0)) {
      const error = new Error('Reference ID must be a valid non-empty string');
      errorLog("desktopmate-adapter", "Invalid input: referenceId", error);
      throw error;
    }

    debugLog("desktopmate-adapter", "Synthesizing speech", {
      textLength: text.length,
      referenceId: referenceId || "default",
      timeout,
      maxRetries,
    });

    let lastError: Error | null = null;

    // Retry loop
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const config = configManager.getConfig();
        const ttsUrl = config.urls.tts;

        const request: TTSRequest = {
          text,
          reference_id: referenceId,
          output_format: "base64",
        };

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(ttsUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            // Check if it's a client error (4xx) - don't retry
            if (response.status >= 400 && response.status < 500) {
              throw new Error(`TTS request failed with client error: ${response.status} ${response.statusText}`);
            }
            // Server error (5xx) - can retry
            throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
          }

          const ttsResponse: TTSResponse = await response.json();

          // Validate response format
          if (!ttsResponse.audio_data || typeof ttsResponse.audio_data !== 'string') {
            throw new Error('Invalid TTS response: missing or invalid audio_data field');
          }

          if (!ttsResponse.format || typeof ttsResponse.format !== 'string') {
            throw new Error('Invalid TTS response: missing or invalid format field');
          }

          // Optional: Validate base64 format
          const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
          if (!base64Regex.test(ttsResponse.audio_data)) {
            throw new Error('Invalid TTS response: audio_data is not valid base64');
          }

          debugLog("desktopmate-adapter", "Speech synthesis complete", {
            hasAudio: !!ttsResponse.audio_data,
            format: ttsResponse.format,
            attempts: attempt,
          });

          return ttsResponse;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Check if it's an abort error (timeout)
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            lastError = new Error(`TTS request timeout after ${timeout}ms`);
            errorLog("desktopmate-adapter", `Speech synthesis timeout (attempt ${attempt}/${maxRetries})`, lastError);
          } else {
            lastError = fetchError as Error;
            errorLog("desktopmate-adapter", `Speech synthesis failed (attempt ${attempt}/${maxRetries})`, lastError);
          }

          // Don't retry on client errors (4xx)
          if (lastError.message.includes('client error')) {
            throw lastError;
          }

          // If not the last attempt, continue to retry
          if (attempt < maxRetries) {
            debugLog("desktopmate-adapter", `Retrying speech synthesis (attempt ${attempt + 1}/${maxRetries})`);
            // Optional: Add exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors or client errors
        if (error instanceof Error && (
          error.message.includes('Invalid TTS response') ||
          error.message.includes('client error')
        )) {
          errorLog("desktopmate-adapter", "Speech synthesis failed (non-retryable error)", lastError);
          throw lastError;
        }

        // If not the last attempt, continue to retry
        if (attempt < maxRetries) {
          debugLog("desktopmate-adapter", `Retrying after error (attempt ${attempt + 1}/${maxRetries})`);
          // Optional: Add exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // All retries exhausted
    errorLog("desktopmate-adapter", `Speech synthesis failed after ${maxRetries} attempts`, lastError!);
    throw lastError || new Error('Speech synthesis failed for unknown reason');
  }

  /**
   * Analyzes an image using VLM service
   *
   * @param image - Base64-encoded image data
   * @param prompt - Question or description request (optional)
   * @returns Promise resolving to VLM response
   */
  async analyzeImage(image: string, prompt?: string): Promise<VLMResponse> {
    debugLog("desktopmate-adapter", "Analyzing image", {
      imageLength: image.length,
      hasPrompt: !!prompt,
    });

    try {
      const config = configManager.getConfig();
      const vlmUrl = config.urls.vlm;

      const request: VLMRequest = {
        image,
        prompt,
      };

      const response = await fetch(vlmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`VLM request failed: ${response.statusText}`);
      }

      const vlmResponse: VLMResponse = await response.json();

      debugLog("desktopmate-adapter", "Image analysis complete", {
        descriptionLength: vlmResponse.description.length,
      });

      return vlmResponse;
    } catch (error) {
      errorLog("desktopmate-adapter", "Image analysis failed", error as Error);
      throw error;
    }
  }

  /**
   * Extracts volume data from audio
   *
   * @param audioData - Base64-encoded WAV audio data
   * @param frameSize - Frame size for volume extraction (default: 1024)
   * @returns Array of normalized volume values (0-1 range)
   */
  extractVolumes(audioData: string, frameSize: number = 1024): number[] {
    debugLog("desktopmate-adapter", "Extracting audio volumes", {
      audioLength: audioData.length,
      frameSize,
    });

    try {
      const volumes = extractVolumesFromWAV(audioData, frameSize);

      debugLog("desktopmate-adapter", "Volume extraction complete", {
        numFrames: volumes.length,
      });

      return volumes;
    } catch (error) {
      errorLog(
        "desktopmate-adapter",
        "Volume extraction failed",
        error as Error,
      );
      throw error;
    }
  }

  // ========================================================================
  // STM (Short-Term Memory) API Methods
  // ========================================================================

  /**
   * Add chat history to a session
   *
   * @param request - Chat history request
   * @returns Promise resolving to session information
   */
  async addChatHistory(
    request: AddChatHistoryRequest,
  ): Promise<AddChatHistoryResponse> {
    debugLog("desktopmate-adapter", "Adding chat history", {
      userId: request.user_id,
      agentId: request.agent_id,
      messageCount: request.messages.length,
    });

    try {
      const config = configManager.getConfig();
      const stmUrl = `${config.urls.stm}/chat-history`;

      const response = await fetch(stmUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `STM add history request failed: ${response.statusText}`,
        );
      }

      const stmResponse: AddChatHistoryResponse = await response.json();

      debugLog("desktopmate-adapter", "Chat history added", {
        sessionId: stmResponse.session_id,
        messageCount: stmResponse.message_count,
      });

      return stmResponse;
    } catch (error) {
      errorLog(
        "desktopmate-adapter",
        "Failed to add chat history",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Get chat history from a session
   *
   * @param request - Get chat history request
   * @returns Promise resolving to chat history
   */
  async getChatHistory(
    request: GetChatHistoryRequest,
  ): Promise<GetChatHistoryResponse> {
    debugLog("desktopmate-adapter", "Getting chat history", {
      userId: request.user_id,
      agentId: request.agent_id,
      sessionId: request.session_id,
    });

    try {
      const config = configManager.getConfig();
      const params = new URLSearchParams({
        user_id: request.user_id,
        agent_id: request.agent_id,
        session_id: request.session_id,
      });

      if (request.limit !== undefined) {
        params.append("limit", request.limit.toString());
      }

      const stmUrl = `${config.urls.stm}/chat-history?${params}`;

      const response = await fetch(stmUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `STM get history request failed: ${response.statusText}`,
        );
      }

      const stmResponse: GetChatHistoryResponse = await response.json();

      debugLog("desktopmate-adapter", "Chat history retrieved", {
        sessionId: stmResponse.session_id,
        messageCount: stmResponse.messages.length,
      });

      return stmResponse;
    } catch (error) {
      errorLog(
        "desktopmate-adapter",
        "Failed to get chat history",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * List all sessions for a user and agent
   *
   * @param request - List sessions request
   * @returns Promise resolving to list of sessions
   */
  async listSessions(
    request: ListSessionsRequest,
  ): Promise<ListSessionsResponse> {
    debugLog("desktopmate-adapter", "Listing sessions", {
      userId: request.user_id,
      agentId: request.agent_id,
    });

    try {
      const config = configManager.getConfig();
      const params = new URLSearchParams({
        user_id: request.user_id,
        agent_id: request.agent_id,
      });

      const stmUrl = `${config.urls.stm}/sessions?${params}`;

      const response = await fetch(stmUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `STM list sessions request failed: ${response.statusText}`,
        );
      }

      const stmResponse: ListSessionsResponse = await response.json();

      debugLog("desktopmate-adapter", "Sessions listed", {
        sessionCount: stmResponse.sessions.length,
      });

      return stmResponse;
    } catch (error) {
      errorLog(
        "desktopmate-adapter",
        "Failed to list sessions",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Delete a session
   *
   * @param request - Delete session request
   * @returns Promise resolving to deletion result
   */
  async deleteSession(
    request: DeleteSessionRequest,
  ): Promise<DeleteSessionResponse> {
    debugLog("desktopmate-adapter", "Deleting session", {
      sessionId: request.session_id,
      userId: request.user_id,
      agentId: request.agent_id,
    });

    try {
      const config = configManager.getConfig();
      const params = new URLSearchParams({
        user_id: request.user_id,
        agent_id: request.agent_id,
      });

      const stmUrl = `${config.urls.stm}/sessions/${request.session_id}?${params}`;

      const response = await fetch(stmUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `STM delete session request failed: ${response.statusText}`,
        );
      }

      const stmResponse: DeleteSessionResponse = await response.json();

      debugLog("desktopmate-adapter", "Session deleted", {
        success: stmResponse.success,
      });

      return stmResponse;
    } catch (error) {
      errorLog(
        "desktopmate-adapter",
        "Failed to delete session",
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Update session metadata
   *
   * @param sessionId - Session identifier
   * @param request - Update metadata request (contains metadata only)
   * @returns Promise resolving to update result
   */
  async updateSessionMetadata(
    sessionId: string,
    params: { metadata: Record<string, unknown> },
  ): Promise<UpdateSessionMetadataResponse> {
    try {
      const config = configManager.getConfig();
      const url = `${config.urls.stm}/sessions/${sessionId}/metadata`;

      const body: UpdateSessionMetadataRequest = {
        session_id: sessionId, // Required in request body
        metadata: params.metadata,
      };

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          `STM update metadata request failed: ${response.statusText}`,
        );
      }

      const result: UpdateSessionMetadataResponse = await response.json();

      debugLog(
        'desktopmate-adapter',
        `Session metadata updated for session ${sessionId}`,
      );

      return result;
    } catch (error) {
      errorLog('desktopmate-adapter', 'Failed to update session metadata', {
        error,
      });
      throw error;
    }
  }
}

/**
 * Singleton instance of DesktopMateAdapter
 */
export const desktopMateAdapter = new DesktopMateAdapter();
