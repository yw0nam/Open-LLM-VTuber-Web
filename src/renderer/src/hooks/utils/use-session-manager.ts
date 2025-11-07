/**
 * Session Manager Hook
 * 
 * Provides CRUD operations for conversation sessions and chat history management.
 * Integrates with STM (Short-Term Memory) API via DesktopMateAdapter.
 * 
 * @module useSessionManager
 */

import { useState, useCallback, useEffect } from 'react';
import { desktopMateAdapter } from '@/services/desktopmate-adapter';
import {
  SessionMetadata,
  STMMessage,
  AddChatHistoryRequest,
  GetChatHistoryRequest,
  ListSessionsRequest,
  DeleteSessionRequest,
} from '@/services/config-types';
import { debugLog, errorLog } from '@/services/logger';

/**
 * Session manager hook state interface
 */
export interface SessionManagerState {
  /** Current active session ID */
  currentSessionId: string | null;
  /** List of all available sessions */
  sessions: SessionMetadata[];
  /** Messages for the current session */
  messages: STMMessage[];
  /** Loading state for async operations */
  isLoading: boolean;
  /** Loading state for session creation */
  isCreatingSession: boolean;
  /** Error state for failed operations */
  error: Error | null;
}

/**
 * Session manager hook return interface
 */
export interface UseSessionManagerReturn extends SessionManagerState {
  /**
   * Load chat history for a specific session
   * @param sessionId - Session identifier
   * @param limit - Maximum number of messages to load (optional)
   * @returns Promise resolving when history is loaded
   */
  loadHistory: (sessionId: string, limit?: number) => Promise<void>;

  /**
   * Save messages to the current or specified session
   * @param messages - Array of messages to save
   * @param sessionId - Optional session ID (uses current if not provided)
   * @returns Promise resolving to the session ID
   */
  saveMessages: (messages: STMMessage[], sessionId?: string) => Promise<string>;

  /**
   * List all sessions for the current user and agent
   * @returns Promise resolving when sessions are loaded
   */
  listSessions: () => Promise<void>;

  /**
   * Create a new session
   * @param initialMessages - Optional initial messages for the session
   * @returns Promise resolving to the new session ID
   */
  createSession: (initialMessages?: STMMessage[]) => Promise<string>;

  /**
   * Delete a session
   * @param sessionId - Session identifier to delete
   * @returns Promise resolving when session is deleted
   */
  deleteSession: (sessionId: string) => Promise<void>;

  /**
   * Set the current active session
   * @param sessionId - Session identifier or null to clear
   */
  setCurrentSessionId: (sessionId: string | null) => void;

  /**
   * Clear error state
   */
  clearError: () => void;

  /**
   * Refresh the current session's history
   * @returns Promise resolving when history is refreshed
   */
  refreshCurrentSession: () => Promise<void>;

  /**
   * Get current session ID or create a new one if it doesn't exist
   * @returns Promise resolving to the session ID
   */
  getOrCreateSession: () => Promise<string>;
}

/**
 * Configuration for the session manager hook
 */
export interface SessionManagerConfig {
  /** User identifier */
  userId: string;
  /** Agent identifier */
  agentId: string;
  /** Auto-load sessions on mount */
  autoLoadSessions?: boolean;
  /** Auto-load history when session changes */
  autoLoadHistory?: boolean;
  /** Auto-create a session on mount if none exists */
  autoCreateSession?: boolean;
}

/**
 * Custom hook for managing conversation sessions and chat history
 * 
 * @param config - Configuration object
 * @returns Session manager state and operations
 * 
 * @example
 * ```tsx
 * function ChatComponent() {
 *   const sessionManager = useSessionManager({
 *     userId: 'user123',
 *     agentId: 'agent456',
 *     autoLoadSessions: true,
 *   });
 * 
 *   const handleCreateSession = async () => {
 *     const sessionId = await sessionManager.createSession();
 *     console.log('Created session:', sessionId);
 *   };
 * 
 *   return (
 *     <div>
 *       {sessionManager.isLoading ? (
 *         <p>Loading...</p>
 *       ) : (
 *         <SessionList sessions={sessionManager.sessions} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSessionManager(config: SessionManagerConfig): UseSessionManagerReturn {
  const {
    userId,
    agentId,
    autoLoadSessions = false,
    autoLoadHistory = true,
    autoCreateSession = false,
  } = config;

  // State management
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [messages, setMessages] = useState<STMMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load chat history for a specific session
   */
  const loadHistory = useCallback(
    async (sessionId: string, limit?: number): Promise<void> => {
      if (!userId || !agentId) {
        const err = new Error('User ID and Agent ID are required');
        errorLog('use-session-manager', 'Load history failed - missing credentials', err);
        setError(err);
        throw err;
      }

      if (!sessionId) {
        const err = new Error('Session ID is required');
        errorLog('use-session-manager', 'Load history failed - missing session ID', err);
        setError(err);
        throw err;
      }

      setIsLoading(true);
      setError(null);

      try {
        debugLog('use-session-manager', 'Loading chat history', { sessionId, limit });

        const request: GetChatHistoryRequest = {
          user_id: userId,
          agent_id: agentId,
          session_id: sessionId,
          limit,
        };

        const response = await desktopMateAdapter.getChatHistory(request);

        setMessages(response.messages);
        setCurrentSessionId(sessionId);

        debugLog('use-session-manager', 'Chat history loaded successfully', {
          sessionId,
          messageCount: response.messages.length,
        });
      } catch (err) {
        const error = err as Error;
        errorLog('use-session-manager', 'Failed to load chat history', error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, agentId],
  );

  /**
   * Save messages to a session
   */
  const saveMessages = useCallback(
    async (messages: STMMessage[], sessionId?: string): Promise<string> => {
      if (!userId || !agentId) {
        const err = new Error('User ID and Agent ID are required');
        errorLog('use-session-manager', 'Save messages failed - missing credentials', err);
        setError(err);
        throw err;
      }

      if (!messages || messages.length === 0) {
        const err = new Error('Messages array cannot be empty');
        errorLog('use-session-manager', 'Save messages failed - empty messages', err);
        setError(err);
        throw err;
      }

      setIsLoading(true);
      setError(null);

      try {
        const targetSessionId = sessionId || currentSessionId || undefined;

        debugLog('use-session-manager', 'Saving messages', {
          sessionId: targetSessionId,
          messageCount: messages.length,
        });

        const request: AddChatHistoryRequest = {
          user_id: userId,
          agent_id: agentId,
          session_id: targetSessionId,
          messages,
        };

        const response = await desktopMateAdapter.addChatHistory(request);

        // Update current session if this was a new session
        if (!targetSessionId) {
          setCurrentSessionId(response.session_id);
        }

        debugLog('use-session-manager', 'Messages saved successfully', {
          sessionId: response.session_id,
          messageCount: response.message_count,
        });

        return response.session_id;
      } catch (err) {
        const error = err as Error;
        errorLog('use-session-manager', 'Failed to save messages', error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, agentId, currentSessionId],
  );

  /**
   * List all sessions
   */
  const listSessions = useCallback(async (): Promise<void> => {
    if (!userId || !agentId) {
      const err = new Error('User ID and Agent ID are required');
      errorLog('use-session-manager', 'List sessions failed - missing credentials', err);
      setError(err);
      throw err;
    }

    setIsLoading(true);
    setError(null);

    try {
      debugLog('use-session-manager', 'Listing sessions', { userId, agentId });

      const request: ListSessionsRequest = {
        user_id: userId,
        agent_id: agentId,
      };

      const response = await desktopMateAdapter.listSessions(request);

      setSessions(response.sessions);

      debugLog('use-session-manager', 'Sessions listed successfully', {
        sessionCount: response.sessions.length,
      });
    } catch (err) {
      const error = err as Error;
      errorLog('use-session-manager', 'Failed to list sessions', error);
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId, agentId]);

  /**
   * Create a new session
   */
  const createSession = useCallback(
    async (initialMessages?: STMMessage[]): Promise<string> => {
      if (!userId || !agentId) {
        const err = new Error('User ID and Agent ID are required');
        errorLog('use-session-manager', 'Create session failed - missing credentials', err);
        setError(err);
        throw err;
      }

      setIsCreatingSession(true);
      setError(null);

      try {
        debugLog('use-session-manager', 'Creating new session', {
          hasInitialMessages: !!initialMessages,
          messageCount: initialMessages?.length || 0,
        });

        // Create session by adding initial messages (session_id omitted = new session)
        const request: AddChatHistoryRequest = {
          user_id: userId,
          agent_id: agentId,
          messages: initialMessages,
        };

        const response = await desktopMateAdapter.addChatHistory(request);

        setCurrentSessionId(response.session_id);
        setMessages(initialMessages || []);

        // Refresh session list to include the new session
        await listSessions();

        debugLog('use-session-manager', 'Session created successfully', {
          sessionId: response.session_id,
        });

        return response.session_id;
      } catch (err) {
        const error = err as Error;
        errorLog('use-session-manager', 'Failed to create session', error);
        setError(error);
        throw error;
      } finally {
        setIsCreatingSession(false);
      }
    },
    [userId, agentId, listSessions],
  );

  /**
   * Delete a session
   */
  const deleteSession = useCallback(
    async (sessionId: string): Promise<void> => {
      if (!userId || !agentId) {
        const err = new Error('User ID and Agent ID are required');
        errorLog('use-session-manager', 'Delete session failed - missing credentials', err);
        setError(err);
        throw err;
      }

      if (!sessionId) {
        const err = new Error('Session ID is required');
        errorLog('use-session-manager', 'Delete session failed - missing session ID', err);
        setError(err);
        throw err;
      }

      setIsLoading(true);
      setError(null);

      try {
        debugLog('use-session-manager', 'Deleting session', { sessionId });

        const request: DeleteSessionRequest = {
          session_id: sessionId,
          user_id: userId,
          agent_id: agentId,
        };

        await desktopMateAdapter.deleteSession(request);

        // Clear current session if it was deleted
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
        }

        // Remove from sessions list
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));

        debugLog('use-session-manager', 'Session deleted successfully', { sessionId });
      } catch (err) {
        const error = err as Error;
        errorLog('use-session-manager', 'Failed to delete session', error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, agentId, currentSessionId],
  );

  /**
   * Refresh the current session's history
   */
  const refreshCurrentSession = useCallback(async (): Promise<void> => {
    if (!currentSessionId) {
      const err = new Error('No current session to refresh');
      errorLog('use-session-manager', 'Refresh failed - no current session', err);
      setError(err);
      throw err;
    }

    await loadHistory(currentSessionId);
  }, [currentSessionId, loadHistory]);

  // Auto-load sessions on mount if configured
  useEffect(() => {
    if (autoLoadSessions && userId && agentId) {
      listSessions().catch((err) => {
        errorLog('use-session-manager', 'Auto-load sessions failed', err);
      });
    }
  }, [autoLoadSessions, userId, agentId, listSessions]);

  // Auto-load history when current session changes if configured
  useEffect(() => {
    if (autoLoadHistory && currentSessionId && userId && agentId) {
      loadHistory(currentSessionId).catch((err) => {
        errorLog('use-session-manager', 'Auto-load history failed', err);
      });
    }
  }, [autoLoadHistory, currentSessionId, userId, agentId]); // Intentionally not including loadHistory to avoid infinite loop

  const getOrCreateSession = useCallback(async (): Promise<string> => {
    if (currentSessionId) {
      return currentSessionId;
    }

    debugLog('use-session-manager', 'No active session, creating a new one.');
    return createSession();
  }, [currentSessionId, createSession]);

  // Auto-create session on mount if configured
  useEffect(() => {
    if (autoCreateSession && !currentSessionId && !isLoading && !isCreatingSession) {
      debugLog('use-session-manager', 'Auto-creating session on mount.');
      getOrCreateSession().catch((err) => {
        errorLog('use-session-manager', 'Auto-create session failed', err);
      });
    }
  }, [autoCreateSession, currentSessionId, isLoading, isCreatingSession, getOrCreateSession]);


  return {
    // State
    currentSessionId,
    sessions,
    messages,
    isLoading,
    isCreatingSession,
    error,

    // Operations
    loadHistory,
    saveMessages,
    listSessions,
    createSession,
    deleteSession,
    setCurrentSessionId,
    clearError,
    refreshCurrentSession,
    getOrCreateSession,
  };
}
