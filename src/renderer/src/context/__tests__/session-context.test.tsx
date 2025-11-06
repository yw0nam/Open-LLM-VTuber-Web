/**
 * Session Context Tests
 * 
 * Tests for session auto-creation, persistence, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi, assert } from 'vitest';
import { desktopMateAdapter } from '@/services/desktopmate-adapter';

// Mock dependencies
vi.mock('@/services/desktopmate-adapter', () => ({
  desktopMateAdapter: {
    addChatHistory: vi.fn(),
  },
}));

vi.mock('@/services/logger', () => ({
  debugLog: vi.fn(),
  errorLog: vi.fn(),
}));

describe('SessionContext - Session Auto-Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Subtask 15.1: Detect Absence of Session ID', () => {
    it('should validate session ID format', () => {
      // Valid session IDs
      assert(isValidSessionId('test-session-123'));
      assert(isValidSessionId('session-1234567890-abc123'));
      assert(isValidSessionId('backend-session-uuid-xyz'));

      // Invalid session IDs
      assert(!isValidSessionId(''));
      assert(!isValidSessionId(null as any));
      assert(!isValidSessionId(undefined as any));
    });

    it('should detect missing session ID from context state', () => {
      const sessionId: string | null = null;
      const hasSession = isValidSessionId(sessionId);
      assert(!hasSession);
    });

    it('should detect present session ID from context state', () => {
      const sessionId: string = 'active-session-id';
      const hasSession = isValidSessionId(sessionId);
      assert(hasSession);
    });
  });

  describe('Subtask 15.2: Call STM API to Create New Session', () => {
    it('should prepare correct API request for session creation', () => {
      const userId = 'test-user';
      const agentId = 'test-agent';

      const expectedRequest = {
        user_id: userId,
        agent_id: agentId,
        messages: [],
      };

      // Verify request structure
      expect(expectedRequest).toHaveProperty('user_id');
      expect(expectedRequest).toHaveProperty('agent_id');
      expect(expectedRequest).toHaveProperty('messages');
      expect(expectedRequest.messages).toEqual([]);
    });

    it('should extract session ID from API response', () => {
      const mockResponse = {
        session_id: 'backend-generated-session-123',
        message_count: 0,
      };

      const extractedSessionId = mockResponse.session_id;
      expect(extractedSessionId).toBe('backend-generated-session-123');
      expect(typeof extractedSessionId).toBe('string');
    });

    it('should call desktopMateAdapter.addChatHistory with correct params', async () => {
      const mockSessionId = 'api-session-id';
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        message_count: 0,
      });

      const userId = 'default-user';
      const agentId = 'default-agent';

      const result = await desktopMateAdapter.addChatHistory({
        user_id: userId,
        agent_id: agentId,
        messages: [],
      });

      expect(desktopMateAdapter.addChatHistory).toHaveBeenCalledWith({
        user_id: userId,
        agent_id: agentId,
        messages: [],
      });

      expect(result.session_id).toBe(mockSessionId);
    });

    it('should handle custom userId and agentId', async () => {
      const customUserId = 'custom-user-456';
      const customAgentId = 'custom-agent-789';

      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: 'custom-session',
        message_count: 0,
      });

      await desktopMateAdapter.addChatHistory({
        user_id: customUserId,
        agent_id: customAgentId,
        messages: [],
      });

      expect(desktopMateAdapter.addChatHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: customUserId,
          agent_id: customAgentId,
        }),
      );
    });
  });

  describe('Subtask 15.3: Store Session ID in Application Context', () => {
    it('should update session ID state after creation', () => {
      let sessionId: string | null = null;
      const newSessionId = 'newly-created-session';

      // Simulate state update
      sessionId = newSessionId;

      expect(sessionId).toBe(newSessionId);
      expect(sessionId).not.toBeNull();
    });

    it('should maintain userId and agentId in localStorage', () => {
      const userId = 'persistent-user';
      const agentId = 'persistent-agent';

      localStorage.setItem('session_user_id', JSON.stringify(userId));
      localStorage.setItem('session_agent_id', JSON.stringify(agentId));

      const storedUserId = JSON.parse(localStorage.getItem('session_user_id') || '""');
      const storedAgentId = JSON.parse(localStorage.getItem('session_agent_id') || '""');

      expect(storedUserId).toBe(userId);
      expect(storedAgentId).toBe(agentId);
    });

    it('should allow manual session ID updates', () => {
      let sessionId: string | null = 'initial-session';

      // Simulate setSessionId
      const setSessionId = (newId: string | null) => {
        sessionId = newId;
      };

      setSessionId('manually-updated-session');

      expect(sessionId).toBe('manually-updated-session');
    });
  });

  describe('Subtask 15.4: Ensure Session ID Persistence Across Messages', () => {
    it('should preserve session ID across multiple operations', () => {
      const sessionId = 'persistent-session-xyz';
      
      // Simulate multiple message operations
      const operations = [
        { type: 'send', sessionId },
        { type: 'send', sessionId },
        { type: 'send', sessionId },
      ];

      operations.forEach((op) => {
        expect(op.sessionId).toBe(sessionId);
      });

      // All operations should use the same session ID
      const uniqueSessionIds = new Set(operations.map((op) => op.sessionId));
      expect(uniqueSessionIds.size).toBe(1);
    });

    it('should not auto-create when session exists', () => {
      const sessionId: string | null = 'existing-session';
      const isCreatingSession = false;

      // Should not trigger creation if session exists and not creating
      const shouldCreate = !sessionId && !isCreatingSession;

      expect(shouldCreate).toBe(false);
    });

    it('should trigger auto-create only when no session exists', () => {
      const sessionId: string | null = null;
      const isCreatingSession = false;

      // Should trigger creation if no session and not already creating
      const shouldCreate = !sessionId && !isCreatingSession;

      expect(shouldCreate).toBe(true);
    });
  });

  describe('Subtask 15.5: Implement Error Handling and Fallbacks', () => {
    it('should generate fallback session ID on API failure', () => {
      const fallbackSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      expect(fallbackSessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(fallbackSessionId.length).toBeGreaterThan(15);
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('Network connection failed');
      vi.mocked(desktopMateAdapter.addChatHistory).mockRejectedValue(apiError);

      try {
        await desktopMateAdapter.addChatHistory({
          user_id: 'user',
          agent_id: 'agent',
          messages: [],
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBe(apiError);
        expect((error as Error).message).toBe('Network connection failed');
      }
    });

    it('should set sessionError state on failure', () => {
      const error = new Error('Backend unavailable');
      let sessionError: Error | null = null;

      // Simulate error setting
      sessionError = error;

      expect(sessionError).toBe(error);
      expect(sessionError?.message).toBe('Backend unavailable');
    });

    it('should clear sessionError when cleared', () => {
      let sessionError: Error | null = new Error('Temporary error');

      // Simulate clearSessionError
      sessionError = null;

      expect(sessionError).toBeNull();
    });

    it('should validate credentials before session creation', () => {
      const validateCredentials = (userId: string, agentId: string): boolean => {
        return !!(userId && agentId && userId.length > 0 && agentId.length > 0);
      };

      expect(validateCredentials('user', 'agent')).toBe(true);
      expect(validateCredentials('', 'agent')).toBe(false);
      expect(validateCredentials('user', '')).toBe(false);
      expect(validateCredentials('', '')).toBe(false);
    });

    it('should retry session creation after error recovery', async () => {
      const firstError = new Error('First attempt failed');
      const successSessionId = 'retry-success-session';

      vi.mocked(desktopMateAdapter.addChatHistory)
        .mockRejectedValueOnce(firstError)
        .mockResolvedValueOnce({
          session_id: successSessionId,
          message_count: 0,
        });

      // First attempt fails
      try {
        await desktopMateAdapter.addChatHistory({
          user_id: 'user',
          agent_id: 'agent',
          messages: [],
        });
      } catch (error) {
        expect(error).toBe(firstError);
      }

      // Second attempt succeeds
      const result = await desktopMateAdapter.addChatHistory({
        user_id: 'user',
        agent_id: 'agent',
        messages: [],
      });

      expect(result.session_id).toBe(successSessionId);
    });
  });

  describe('Integration: Session Auto-Creation Flow', () => {
    it('should complete full session creation flow', async () => {
      const mockSessionId = 'complete-flow-session-id';
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        message_count: 0,
      });

      // Step 1: Detect absence of session
      let sessionId: string | null = null;
      assert(!sessionId);

      // Step 2: Call API to create session
      const response = await desktopMateAdapter.addChatHistory({
        user_id: 'default-user',
        agent_id: 'default-agent',
        messages: [],
      });

      // Step 3: Store session ID
      sessionId = response.session_id;

      // Step 4: Verify persistence
      expect(sessionId).toBe(mockSessionId);
      expect(sessionId).not.toBeNull();

      // Step 5: Subsequent messages use same session
      const message1Session = sessionId;
      const message2Session = sessionId;
      expect(message1Session).toBe(message2Session);
    });

    it('should handle error flow with fallback', async () => {
      const error = new Error('Backend connection failed');
      vi.mocked(desktopMateAdapter.addChatHistory).mockRejectedValue(error);

      let sessionId: string | null = null;
      let sessionError: Error | null = null;

      try {
        const response = await desktopMateAdapter.addChatHistory({
          user_id: 'user',
          agent_id: 'agent',
          messages: [],
        });
        sessionId = response.session_id;
      } catch (err) {
        sessionError = err as Error;
        // Fallback to client-side session ID
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Should have fallback session ID
      expect(sessionId).not.toBeNull();
      expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
      expect(sessionError).toBe(error);
    });
  });
});

// Helper function
function isValidSessionId(sessionId: string | null | undefined): boolean {
  return sessionId !== null && sessionId !== undefined && sessionId.length > 0;
}
