
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  wsService,
  WebSocketConnectionState,
} from "./client";
import { useChatHistory } from "@/context/chat-history-context";
import { audioTaskQueue } from "@/utils/task-queue";
import { useAudioTask } from "@/components/canvas/live2d";
import { WSServerMessage, WSTTSReadyChunkMessage } from "@/services/schemas/websocket";

interface WebSocketHandlerContextProps {
  sendMessage: (message: Record<string, unknown>) => void;
  wsState: WebSocketConnectionState;
}

const WebSocketHandlerContext = createContext<WebSocketHandlerContextProps | null>(
  null,
);

export function useWebSocketHandler() {
  const context = useContext(WebSocketHandlerContext);
  if (!context) {
    throw new Error(
      "useWebSocketHandler must be used within a WebSocketHandlerProvider",
    );
  }
  return context;
}

export function WebSocketHandlerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { 
    appendAIMessage, 
    appendToolCallRequest, 
    appendToolResult 
  } = useChatHistory();
  const { addAudioTask } = useAudioTask();
  const [wsState, setWsState] = useState<WebSocketConnectionState>("IDLE");

  useEffect(() => {
    const stateSubscription = wsService.onStateChange((state) => {
      setWsState(state);
    });

    const messageSubscription = wsService.onMessage(
      (message: WSServerMessage) => {
        switch (message.type) {
          case "stream_start":
            // New conversation turn started
            console.log("Stream started:", message.turn_id);
            break;
          case "stream_token":
            // Agent response chunk received
            appendAIMessage(message.chunk);
            break;
          case "stream_end":
            // Conversation turn completed
            // Backend automatically saves to STM/LTM at this point
            console.log("Stream ended:", message.turn_id);
            break;
          case "tts_ready_chunk":
            // Text chunk ready for TTS synthesis
            if (message.chunk) {
              addAudioTask({
                text: message.chunk,
                expression: message.emotion,
              });
            }
            break;
          case "tool_call":
            // Note: Currently NOT sent by backend (logged server-side only)
            // Implemented for future use when backend forwards these events
            console.log("Tool call:", message.tool_name, message.args);
            try {
              const args = JSON.parse(message.args);
              appendToolCallRequest([{ name: message.tool_name, arguments: args }]);
            } catch (e) {
              console.error("Failed to parse tool call args:", e);
            }
            break;
          case "tool_result":
            // Note: Currently NOT sent by backend (logged server-side only)
            // Implemented for future use when backend forwards these events
            console.log("Tool result:", message.result);
            try {
              const result = JSON.parse(message.result);
              appendToolResult({
                tool_call_id: result.tool_call_id || crypto.randomUUID(),
                content: result.content || message.result,
                name: result.name || "unknown",
              });
            } catch (e) {
              console.error("Failed to parse tool result:", e);
            }
            break;
          case "error":
            console.error("WebSocket error:", message.error);
            break;
          default:
            break;
        }
      },
    );

    return () => {
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [appendAIMessage, appendToolCallRequest, appendToolResult, addAudioTask]);

  const sendMessage = (message: Record<string, unknown>) => {
    wsService.sendMessage(message);
  };

  const contextValue = useMemo(
    () => ({
      sendMessage,
      wsState,
    }),
    [wsState],
  );

  return (
    <WebSocketHandlerContext.Provider value={contextValue}>
      {children}
    </WebSocketHandlerContext.Provider>
  );
}
