/**
 * Session Context
 * 
 * Manages session metadata for the application including user_id, agent_id, and session_id.
 * Handles session creation and persistence.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';

interface SessionContextType {
  userId: string;
  agentId: string;
  sessionId: string | null;
  setUserId: (id: string) => void;
  setAgentId: (id: string) => void;
  setSessionId: (id: string | null) => void;
  createNewSession: () => void;
  hasValidSession: () => boolean;
}

const DEFAULT_USER_ID = 'default-user';
const DEFAULT_AGENT_ID = 'default-agent';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [userId, setUserIdStorage] = useLocalStorage('session_user_id', DEFAULT_USER_ID);
  const [agentId, setAgentIdStorage] = useLocalStorage('session_agent_id', DEFAULT_AGENT_ID);
  const [sessionId, setSessionIdState] = useState<string | null>(null);

  const setUserId = useCallback((id: string) => {
    setUserIdStorage(id);
  }, [setUserIdStorage]);

  const setAgentId = useCallback((id: string) => {
    setAgentIdStorage(id);
  }, [setAgentIdStorage]);

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
  }, []);

  const createNewSession = useCallback(() => {
    // Generate a unique session ID
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionIdState(newSessionId);
    console.log('[Session] Created new session:', newSessionId);
  }, []);

  const hasValidSession = useCallback(() => {
    return sessionId !== null && sessionId.length > 0;
  }, [sessionId]);

  // Initialize session on mount if not exists
  useEffect(() => {
    if (!sessionId) {
      createNewSession();
    }
  }, [sessionId, createNewSession]);

  const value: SessionContextType = {
    userId,
    agentId,
    sessionId,
    setUserId,
    setAgentId,
    setSessionId,
    createNewSession,
    hasValidSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
