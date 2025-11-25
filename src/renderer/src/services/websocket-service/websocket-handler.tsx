// src/renderer/src/services/websocket-service/websocket-handler.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next"; // For localization
import { toaster } from "@/components/ui/toaster"; // UI Toast notification

// Services & Hooks
import {
  wsService,
  WebSocketConnectionState,
} from "./client";
import { useLocalStorage } from "@/hooks/utils/use-local-storage";
import { useChatHistory } from "@/context/chat-history-context";
import { useAudioTask } from "@/hooks/utils/use-audio-task";
import { useAiState } from "@/context/ai-state-context";
import { useConfig } from "@/context/character-config-context";
import { useBgUrl } from "@/context/bgurl-context";
import { useWebSocket } from "@/context/websocket-context";

// Handlers & Schemas
import { handleWebSocketMessage, WebSocketHandlerDeps } from "./handlers"; // Centralized handler
import { WSServerMessage } from "@/services/schemas/websocket";

interface WebSocketHandlerContextProps {
  sendMessage: (message: Record<string, unknown>) => void;
  wsState: WebSocketConnectionState;
  wsUrl: string;
  setWsUrl: (url: string) => void;
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
  // 1. Dependencies for Injection
  const chatHistory = useChatHistory();
  const { addAudioTask } = useAudioTask();
  const { aiState, setAiState } = useAiState(); // Ensure this context exposes the current AI state
  const config = useConfig();
  const bgUrl = useBgUrl();
  const { baseUrl } = useWebSocket();
  const { t } = useTranslation();

  // 2. State Management
  const [wsState, setWsState] = useState<WebSocketConnectionState>("IDLE");
  
  // Persist WebSocket URL using local storage hook
  const [wsUrl, setWsUrl] = useLocalStorage<string>(
    "ws_url", 
    "ws://127.0.0.1:5500/v1/chat/stream"
  );

  // 3. Connection Management
  // Establishes or reconnects WebSocket whenever the URL changes
  useEffect(() => {
    if (wsUrl) {
      wsService.connect(wsUrl);
    }
    return () => {
      wsService.disconnect();
    };
  }, [wsUrl]);

  // 4. Event Subscription & Message Handling
  useEffect(() => {
    // Subscribe to connection state changes
    const stateSubscription = wsService.onStateChange((state) => {
      setWsState(state);
    });

    // Subscribe to incoming messages and delegate to the handler registry
    const messageSubscription = wsService.onMessage(
      async (message: WSServerMessage) => {
        // Construct dependency object for handlers
        const deps: WebSocketHandlerDeps = {
          aiState,
          setAiState,
          addAudioTask,
          chatHistory, // Pass the entire object or pick specific methods as defined in interface
          config,
          bgUrl,
          baseUrl,
          t,
          toaster,
        };

        // Delegate processing to the centralized handler function
        await handleWebSocketMessage(message, deps);
      },
    );

    return () => {
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [aiState, setAiState, addAudioTask, chatHistory, config, bgUrl, baseUrl, t]);

  const sendMessage = (message: Record<string, unknown>) => {
    wsService.sendMessage(message);
  };

  const contextValue = useMemo(
    () => ({
      sendMessage,
      wsState,
      wsUrl,
      setWsUrl,
    }),
    [wsState, wsUrl, setWsUrl],
  );

  return (
    <WebSocketHandlerContext.Provider value={contextValue}>
      {children}
    </WebSocketHandlerContext.Provider>
  );
}