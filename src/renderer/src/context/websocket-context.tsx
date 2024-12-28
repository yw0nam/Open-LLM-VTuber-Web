import React, { useContext } from 'react';
import { wsService } from '@/services/websocket-service';
export const wsUrl = "ws://127.0.0.1:12393/client-ws";
export const baseUrl = wsUrl.replace("ws:", window.location.protocol).replace("/client-ws", "")

export interface HistoryInfo {
  uid: string;
  latest_message: {
    role: 'human' | 'ai';
    timestamp: string;
    content: string;
  } | null;
  timestamp: string | null;
}

interface WebSocketContextProps {
  sendMessage: (message: object) => void;
  wsState: string;
  reconnect: () => void;
}

export const WebSocketContext = React.createContext<WebSocketContextProps>({
  sendMessage: wsService.sendMessage.bind(wsService),
  wsState: 'CLOSED',
  reconnect: () => wsService.connect('ws://127.0.0.1:12393/client-ws'),
});

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
