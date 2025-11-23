import type { WSServerMessage } from "@/services/schemas/websocket";
import type { AiState } from "@/context/ai-state-context";
import type { useAudioTask } from "@/hooks/utils/use-audio-task";
import type { useChatHistory } from "@/context/chat-history-context";

// Import specific handlers
import { handleTTSReadyChunk } from "./handleTTSReadyChunk";

/**
 * Dependency injection interface for WebSocket message handlers.
 * Bundles necessary hooks and state management functions.
 */
export interface WebSocketHandlerDeps {
  aiState: AiState;
  addAudioTask: ReturnType<typeof useAudioTask>["addAudioTask"];
  chatHistory: Pick<
    ReturnType<typeof useChatHistory>,
    "appendAIMessage" | "appendToolCallRequest" | "appendToolResult" | "setForceNewMessage"
  >;
  t: (key: string) => string;
  toaster?: any; // Replace 'any' with specific Toaster type if available
}

/**
 * Type definition for a specific message handler function.
 */
type MessageHandler<T extends WSServerMessage["type"]> = (
  message: Extract<WSServerMessage, { type: T }>,
  deps: WebSocketHandlerDeps
) => Promise<void> | void;

/**
 * Registry mapping message types to their respective handler functions.
 * Centralizes logic for easier maintenance and scalability.
 */
export const messageHandlers: Partial<{
  [K in WSServerMessage["type"]]: MessageHandler<K>;
}> = {
  /**
   * Handles TTS chunk readiness for audio synthesis.
   */
  tts_ready_chunk: async (message, deps) => {
    await handleTTSReadyChunk(
      message.chunk,
      message.emotion ?? null,
      deps.aiState,
      deps.addAudioTask,
      deps.t,
      deps.toaster
    );
  },

  /**
   * Handles incoming AI text stream tokens.
   */
  stream_token: (message, deps) => {
    if (message.chunk) {
      deps.chatHistory.appendAIMessage(message.chunk);
    }
  },

  /**
   * Handles tool call requests from the server.
   */
  tool_call: (message, deps) => {
    try {
      const args = JSON.parse(message.args);
      deps.chatHistory.appendToolCallRequest([{ 
        name: message.tool_name, 
        arguments: args 
      }]);
    } catch (error) {
      console.error("Failed to parse tool call arguments:", error);
    }
  },

  /**
   * Handles server-side errors.
   */
  error: (message, deps) => {
    console.error("WebSocket Server Error:", message.error);
    deps.toaster?.create({
      title: message.error,
      type: "error",
      duration: 3000,
    });
  },

  /**
   * Handles stream start notification from server.
   */
  stream_start: (message, _deps) => {
    console.log("Stream started:", {
      turn_id: message.turn_id,
      conversation_id: message.conversation_id,
    });
    // Optionally update UI state to show "AI is thinking"
    // This is handled by the AI state context in the application
  },

  /**
   * Handles stream end notification from server.
   * Backend automatically saves to STM at this point.
   */
  stream_end: (message, deps) => {
    console.log("Stream ended:", {
      turn_id: message.turn_id,
      conversation_id: message.conversation_id,
      content: message.content,
    });
    // Force next AI message to be a new message (not appended)
    deps.chatHistory.setForceNewMessage(true);
  },

  /**
   * Handles tool execution result from server.
   */
  tool_result: (message, _deps) => {
    try {
      // The result is a JSON string, parse if needed for display
      console.log("Tool result received:", message.result);
      
      // Note: appendToolResult expects tool_call_id which we need to track
      // For now, we'll log it. Full implementation requires maintaining
      // a mapping of tool calls to their IDs.
      // _deps.chatHistory.appendToolResult({
      //   tool_call_id: "tracked_id", // TODO: Implement tool call ID tracking
      //   content: message.result,
      //   name: "tool_name", // TODO: Track tool name from tool_call
      // });
    } catch (error) {
      console.error("Failed to handle tool result:", error);
    }
  },

  /**
   * Handles successful authorization.
   * Note: This is also handled in client.ts, this is for any UI updates.
   */
  authorize_success: (message, _deps) => {
    console.log("WebSocket authorized:", message.connection_id);
  },

  /**
   * Handles authorization errors.
   * Note: This is also handled in client.ts with a toaster.
   */
  authorize_error: (message, _deps) => {
    console.error("WebSocket authorization failed:", message.error);
  },

  /**
   * Handles ping messages from server.
   * Note: Pong is automatically sent by client.ts
   */
  ping: (_message, _deps) => {
    // Pong is handled automatically in client.ts
  },
};

/**
 * Main entry point for handling WebSocket messages.
 * Dispatches messages to the appropriate handler based on message type.
 *
 * @param message - The parsed message received from the WebSocket server.
 * @param deps - The dependencies required by the handlers.
 */
export async function handleWebSocketMessage(
  message: WSServerMessage,
  deps: WebSocketHandlerDeps
) {
  const handler = messageHandlers[message.type];

  if (handler) {
    try {
      // Type assertion used to match the specific handler signature
      await (handler as Function)(message, deps);
    } catch (error) {
      console.error(`Error executing handler for type "${message.type}":`, error);
    }
  } else {
    // Log unhandled message types for debugging purposes
    // console.debug(`No handler registered for message type: ${message.type}`);
  }
}