// src/renderer/src/context/websocket-context.tsx

/* eslint-disable react/jsx-no-constructed-context-values */
import React, {
  useContext,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
// client.ts에서 실제 wsService와 타입을 가져옵니다.
import {
  wsService,
  type WebSocketConnectionState,
} from "@/services/websocket-service/client";

const DEFAULT_WS_URL = "ws://127.0.0.1:5500/v1/chat/stream";
const DEFAULT_BASE_URL = "http://127.0.0.1:5500/v1";

interface WebSocketContextProps {
  sendMessage: (
    message: Record<string, unknown>,
    options?: { requireAuth?: boolean },
  ) => void;
  wsState: WebSocketConnectionState; // "CLOSED" 대신 실제 타입 사용
  reconnect: () => void;
  wsUrl: string;
  setWsUrl: (url: string) => void;
  baseUrl: string;
  setBaseUrl: React.Dispatch<React.SetStateAction<string>>;
}

export const WebSocketContext = React.createContext<WebSocketContextProps>({
  sendMessage: wsService.sendMessage.bind(wsService),
  // 기본값은 wsService의 현재 상태를 따르는 것이 좋지만,
  // Provider 외부에서 사용될 일이 없으므로 "CLOSED"도 무방합니다.
  wsState: wsService.getCurrentState() || "CLOSED",
  reconnect: () => wsService.connect(DEFAULT_WS_URL),
  wsUrl: DEFAULT_WS_URL,
  setWsUrl: () => {},
  baseUrl: DEFAULT_BASE_URL,
  setBaseUrl: () => {},
});

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}

export const defaultWsUrl = DEFAULT_WS_URL;
export const defaultBaseUrl = DEFAULT_BASE_URL;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);

  // wsService에서 현재 상태를 가져와 초기화합니다.
  const [wsState, setWsState] = useState<WebSocketConnectionState>(
    wsService.getCurrentState(),
  );

  useEffect(() => {
    // 1. wsService의 상태 변경을 구독합니다.
    // onStateChange는 RxJS Subscription 객체를 반환합니다.
    const stateSubscription = wsService.onStateChange((newState) => {
      setWsState(newState);
    });

    // 2. Provider 마운트 시 연결을 시도합니다.
    // (이미 연결 중이거나 열려있지 않은 경우에만)
    const currentState = wsService.getCurrentState();
    if (currentState === "CLOSED" || currentState === "ERROR") {
      wsService.connect(wsUrl);
    }

    // 3. Provider 언마운트 시 정리(cleanup)합니다.
    return () => {
      // RxJS 구독을 해제합니다. (메모리 누수 방지)
      stateSubscription.unsubscribe();
      // 의도적으로 Provider를 닫는 것이므로, 재연결을 시도하지 않도록 disconnect합니다.
      wsService.disconnect({ suppressReconnect: true });
    };
  }, [wsUrl]); // wsUrl이 변경되면 effect가 다시 실행되어 재연결합니다.

  // URL 변경 핸들러
  const handleSetWsUrl = useCallback((url: string) => {
    setWsUrl(url);
    // setWsUrl이 호출되면 [wsUrl] 의존성을 가진 useEffect가
    // 자동으로 cleanup을 실행하고 새 URL로 다시 연결합니다.
  }, []);

  // 재연결 함수 (useCallback으로 메모이제이션)
  const reconnect = useCallback(() => {
    // 현재 설정된 wsUrl로 다시 연결 시도
    wsService.connect(wsUrl);
  }, [wsUrl]);

  // [수정 2] useMemo로 value 객체 메모이제이션
  const value = useMemo(
    () => ({
      // wsService는 싱글톤이므로 .bind(wsService)는 안전합니다.
      sendMessage: wsService.sendMessage.bind(wsService),
      wsState, // React state로부터 최신 상태를 받아옵니다.
      reconnect,
      wsUrl,
      setWsUrl: handleSetWsUrl,
      baseUrl,
      setBaseUrl,
    }),
    // 의존성 배열: 이 값들이 변경될 때만 value 객체를 새로 만듭니다.
    [wsState, reconnect, wsUrl, handleSetWsUrl, baseUrl],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}