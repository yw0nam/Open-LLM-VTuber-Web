/* eslint-disable react/jsx-no-constructed-context-values */
import React, { useContext, useCallback } from 'react';
import { wsService } from '@/services/websocket-service';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { configManager } from '@/services/desktopmate-config';

// Load defaults from centralized configuration
const getDefaultUrls = () => {
  const urlsConfig = configManager.getSection('urls');
  return {
    wsUrl: urlsConfig.wsUrl || 'ws://localhost:5500/v1/chat/stream',
    baseUrl: urlsConfig.baseUrl || 'http://127.0.0.1:5500',
  };
};

const DEFAULT_URLS = getDefaultUrls();
const DEFAULT_WS_URL = DEFAULT_URLS.wsUrl;
const DEFAULT_BASE_URL = DEFAULT_URLS.baseUrl;

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
  wsUrl: string;
  setWsUrl: (url: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
}

export const WebSocketContext = React.createContext<WebSocketContextProps>({
  sendMessage: wsService.sendMessage.bind(wsService),
  wsState: 'CLOSED',
  reconnect: () => wsService.connect(DEFAULT_WS_URL),
  wsUrl: DEFAULT_WS_URL,
  setWsUrl: () => {},
  baseUrl: DEFAULT_BASE_URL,
  setBaseUrl: () => {},
});

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export const defaultWsUrl = DEFAULT_WS_URL;
export const defaultBaseUrl = DEFAULT_BASE_URL;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [wsUrl, setWsUrl] = useLocalStorage('wsUrl', DEFAULT_WS_URL);
  const [baseUrl, setBaseUrl] = useLocalStorage('baseUrl', DEFAULT_BASE_URL);
  
  const handleSetWsUrl = useCallback((url: string) => {
    setWsUrl(url);
    // Update centralized config
    configManager.updateValue('urls', 'wsUrl', url);
    // Reconnect with new URL
    wsService.connect(url);
  }, [setWsUrl]);

  const handleSetBaseUrl = useCallback((url: string) => {
    setBaseUrl(url);
    // Update centralized config
    configManager.updateValue('urls', 'baseUrl', url);
  }, [setBaseUrl]);

  const value = {
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState: 'CLOSED',
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl: handleSetWsUrl,
    baseUrl,
    setBaseUrl: handleSetBaseUrl,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
