import type { WSServerMessage } from "@/services/schemas/websocket";
import { WebSocketHandlerDeps, MessageHandler } from "./types";
import { agentHandlers } from "./agent_messages";
import { configHandlers } from "./fetch_configs";

// Re-export types for consumers
export type { WebSocketHandlerDeps };

/**
 * Registry mapping message types to their respective handler functions.
 * Centralizes logic for easier maintenance and scalability.
 */
export const messageHandlers: Partial<{
  [K in WSServerMessage["type"]]: MessageHandler<K>;
}> = {
  // Spread agent-related handlers
  ...agentHandlers,
  // Spread config-related handlers
  ...configHandlers,

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