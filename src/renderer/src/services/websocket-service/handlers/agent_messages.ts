import { WSServerMessage } from "@/services/schemas/websocket";
import { MessageHandler } from "./types";
import { handleTTSReadyChunk } from "./handleTTSReadyChunk";

export const agentHandlers: Partial<{
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
};
