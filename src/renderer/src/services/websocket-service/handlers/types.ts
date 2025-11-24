import type { WSServerMessage } from "@/services/schemas/websocket";
import type { AiState } from "@/context/ai-state-context";
import type { useAudioTask } from "@/hooks/utils/use-audio-task";
import type { useChatHistory } from "@/context/chat-history-context";
import type { useConfig } from "@/context/character-config-context";
import type { useBgUrl } from "@/context/bgurl-context";

/**
 * Dependency injection interface for WebSocket message handlers.
 * Bundles necessary hooks and state management functions.
 */
export interface WebSocketHandlerDeps {
  aiState: AiState;
  setAiState: (state: AiState) => void;
  addAudioTask: ReturnType<typeof useAudioTask>["addAudioTask"];
  chatHistory: Pick<
    ReturnType<typeof useChatHistory>,
    "appendAIMessage" | "appendToolCallRequest" | "appendToolResult" | "setForceNewMessage"
  >;
  config: ReturnType<typeof useConfig>;
  bgUrl: ReturnType<typeof useBgUrl>;
  baseUrl: string;
  t: (key: string) => string;
  toaster?: any; // Replace 'any' with specific Toaster type if available
}

/**
 * Type definition for a specific message handler function.
 */
export type MessageHandler<T extends WSServerMessage["type"]> = (
  message: Extract<WSServerMessage, { type: T }>,
  deps: WebSocketHandlerDeps
) => Promise<void> | void;
