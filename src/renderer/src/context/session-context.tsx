/**
 * Session Context
 * 
 * Manages session metadata for the application including user_id, agent_id, and session_id.
 * Handles session creation and persistence with STM API integration.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { desktopMateAdapter } from '@/services/desktopmate-adapter';
import { debugLog, errorLog } from '@/services/logger';

interface SessionContextType {
  userId: string;
  agentId: string;
  sessionId: string | null;
  setUserId: (id: string) => void;
  setAgentId: (id: string) => void;
  setSessionId: (id: string | null) => void;
  createNewSession: () => Promise<string>;
  hasValidSession: () => boolean;
  isCreatingSession: boolean;
  sessionError: Error | null;
  clearSessionError: () => void;
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
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<Error | null>(null);

  const setUserId = useCallback((id: string) => {
    setUserIdStorage(id);
  }, [setUserIdStorage]);

  const setAgentId = useCallback((id: string) => {
    setAgentIdStorage(id);
  }, [setAgentIdStorage]);

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id);
  }, []);

  const clearSessionError = useCallback(() => {
    setSessionError(null);
  }, []);

  /**
   * Create a new session via STM API
   * Returns the session ID on success
   */
  const createNewSession = useCallback(async (): Promise<string> => {
    if (!userId || !agentId) {
      const err = new Error('User ID and Agent ID are required to create a session');
      errorLog('session-context', 'Failed to create session - missing credentials', err);
      setSessionError(err);
      throw err;
    }

    setIsCreatingSession(true);
    setSessionError(null);

    try {
      debugLog('session-context', 'Creating new session via STM API', { userId, agentId });

      // Create session by adding an initial system message (backend requires at least 1 message)
      const response = await desktopMateAdapter.addChatHistory({
        user_id: userId,
        agent_id: agentId,
        messages: [],
      });

      const newSessionId = response.session_id;
      setSessionIdState(newSessionId);

      debugLog('session-context', 'Session created successfully', {
        sessionId: newSessionId,
      });

      return newSessionId;
    } catch (err) {
      const error = err as Error;
      errorLog('session-context', 'Failed to create session via STM API', error);
      setSessionError(error);

      // Fallback: Generate a client-side session ID
      const fallbackSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionIdState(fallbackSessionId);
      
      errorLog('session-context', 'Using fallback session ID', { sessionId: fallbackSessionId });
      
      return fallbackSessionId;
    } finally {
      setIsCreatingSession(false);
    }
  }, [userId, agentId]);

  const hasValidSession = useCallback(() => {
    return sessionId !== null && sessionId.length > 0;
  }, [sessionId]);

  // Auto-create session on mount if not exists
  useEffect(() => {
    if (!sessionId && !isCreatingSession) {
      createNewSession().catch((error) => {
        errorLog('session-context', 'Auto-create session failed', error);
      });
    }
  }, [sessionId, isCreatingSession, createNewSession]);

  const value: SessionContextType = {
    userId,
    agentId,
    sessionId,
    setUserId,
    setAgentId,
    setSessionId,
    createNewSession,
    hasValidSession,
    isCreatingSession,
    sessionError,
    clearSessionError,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
