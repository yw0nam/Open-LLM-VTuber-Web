/**
 * Tests for Session Manager Hook
 * Tests the adapter integration layer for session management operations
 */

import { describe, it, beforeEach, afterEach, vi, expect, assert } from 'vitest';
import { desktopMateAdapter } from '@/services/desktopmate-adapter';
import type { STMMessage, SessionMetadata } from '@/services/config-types';

// Mock the desktopmate-adapter
vi.mock('@/services/desktopmate-adapter', () => ({
  desktopMateAdapter: {
    getChatHistory: vi.fn(),
    addChatHistory: vi.fn(),
    listSessions: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/services/logger', () => ({
  debugLog: vi.fn(),
  errorLog: vi.fn(),
}));

describe('Session Manager Adapter Integration', () => {
  const mockUserId = 'test-user-123';
  const mockAgentId = 'test-agent-456';
  const mockSessionId = 'session-1';

  const mockMessages: STMMessage[] = [
    { type: 'human', content: 'Hello' },
    { type: 'ai', content: 'Hi there!' },
  ];

  const mockSessions: SessionMetadata[] = [
    {
      session_id: 'session-1',
      user_id: mockUserId,
      agent_id: mockAgentId,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:10:00Z',
      metadata: {},
    },
    {
      session_id: 'session-2',
      user_id: mockUserId,
      agent_id: mockAgentId,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:10:00Z',
      metadata: {},
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getChatHistory', () => {
    it('should fetch chat history successfully', async () => {
      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        messages: mockMessages,
      });

      const result = await desktopMateAdapter.getChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: mockSessionId,
      });

      assert.equal(result.session_id, mockSessionId);
      assert.deepEqual(result.messages, mockMessages);
      assert.equal(result.messages.length, 2);
    });

    it('should fetch history with limit parameter', async () => {
      const limitedMessages = [mockMessages[0]];
      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        messages: limitedMessages,
      });

      const result = await desktopMateAdapter.getChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: mockSessionId,
        limit: 1,
      });

      assert.equal(result.messages.length, 1);
      assert.deepEqual(result.messages[0], mockMessages[0]);
    });

    it('should handle getChatHistory errors', async () => {
      const mockError = new Error('Session not found');
      vi.mocked(desktopMateAdapter.getChatHistory).mockRejectedValue(mockError);

      await expect(
        desktopMateAdapter.getChatHistory({
          user_id: mockUserId,
          agent_id: mockAgentId,
          session_id: 'invalid-session',
        }),
      ).rejects.toThrow('Session not found');
    });

    it('should handle empty chat history', async () => {
      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        messages: [],
      });

      const result = await desktopMateAdapter.getChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: mockSessionId,
      });

      assert.deepEqual(result.messages, []);
    });
  });

  describe('addChatHistory', () => {
    it('should add messages to new session', async () => {
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: 'new-session-id',
        message_count: 2,
      });

      const result = await desktopMateAdapter.addChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        messages: mockMessages,
      });

      assert.equal(result.session_id, 'new-session-id');
      assert.equal(result.message_count, 2);
    });

    it('should append messages to existing session', async () => {
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        message_count: 4,
      });

      const result = await desktopMateAdapter.addChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: mockSessionId,
        messages: mockMessages,
      });

      assert.equal(result.session_id, mockSessionId);
      assert.equal(result.message_count, 4);
    });

    it('should handle addChatHistory errors', async () => {
      const mockError = new Error('Save failed');
      vi.mocked(desktopMateAdapter.addChatHistory).mockRejectedValue(mockError);

      await expect(
        desktopMateAdapter.addChatHistory({
          user_id: mockUserId,
          agent_id: mockAgentId,
          messages: mockMessages,
        }),
      ).rejects.toThrow('Save failed');
    });

    it('should handle single message', async () => {
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        message_count: 1,
      });

      const result = await desktopMateAdapter.addChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        messages: [mockMessages[0]],
      });

      assert.equal(result.message_count, 1);
    });
  });

  describe('listSessions', () => {
    it('should list all sessions for user and agent', async () => {
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });

      const result = await desktopMateAdapter.listSessions({
        user_id: mockUserId,
        agent_id: mockAgentId,
      });

      assert.equal(result.sessions.length, 2);
      assert.deepEqual(result.sessions, mockSessions);
    });

    it('should handle empty session list', async () => {
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: [],
      });

      const result = await desktopMateAdapter.listSessions({
        user_id: mockUserId,
        agent_id: mockAgentId,
      });

      assert.deepEqual(result.sessions, []);
    });

    it('should handle listSessions errors', async () => {
      const mockError = new Error('Network error');
      vi.mocked(desktopMateAdapter.listSessions).mockRejectedValue(mockError);

      await expect(
        desktopMateAdapter.listSessions({
          user_id: mockUserId,
          agent_id: mockAgentId,
        }),
      ).rejects.toThrow('Network error');
    });

    it('should list sessions with metadata', async () => {
      const sessionsWithMetadata: SessionMetadata[] = [
        {
          ...mockSessions[0],
          metadata: { title: 'Chat 1', tags: ['important'] },
        },
      ];

      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: sessionsWithMetadata,
      });

      const result = await desktopMateAdapter.listSessions({
        user_id: mockUserId,
        agent_id: mockAgentId,
      });

      assert.equal(result.sessions[0].metadata?.title, 'Chat 1');
      assert.deepEqual(result.sessions[0].metadata?.tags, ['important']);
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      vi.mocked(desktopMateAdapter.deleteSession).mockResolvedValue({
        success: true,
        message: 'Session deleted successfully',
      });

      const result = await desktopMateAdapter.deleteSession({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: mockSessionId,
      });

      assert.isTrue(result.success);
      assert.equal(result.message, 'Session deleted successfully');
    });

    it('should handle deleteSession errors', async () => {
      const mockError = new Error('Session not found');
      vi.mocked(desktopMateAdapter.deleteSession).mockRejectedValue(mockError);

      await expect(
        desktopMateAdapter.deleteSession({
          user_id: mockUserId,
          agent_id: mockAgentId,
          session_id: 'invalid-session',
        }),
      ).rejects.toThrow('Session not found');
    });

    it('should handle deletion failure', async () => {
      vi.mocked(desktopMateAdapter.deleteSession).mockResolvedValue({
        success: false,
        message: 'Session is locked',
      });

      const result = await desktopMateAdapter.deleteSession({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: mockSessionId,
      });

      assert.isFalse(result.success);
      assert.include(result.message, 'locked');
    });
  });

  describe('Integration Workflows', () => {
    it('should create, populate, and retrieve session', async () => {
      // Create session
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: 'new-session',
        message_count: 2,
      });

      const createResult = await desktopMateAdapter.addChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        messages: mockMessages,
      });

      assert.equal(createResult.session_id, 'new-session');

      // Retrieve history
      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: 'new-session',
        messages: mockMessages,
      });

      const historyResult = await desktopMateAdapter.getChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: 'new-session',
      });

      assert.deepEqual(historyResult.messages, mockMessages);
    });

    it('should list sessions after creating multiple', async () => {
      // Create sessions
      vi.mocked(desktopMateAdapter.addChatHistory)
        .mockResolvedValueOnce({
          session_id: 'session-1',
          message_count: 2,
        })
        .mockResolvedValueOnce({
          session_id: 'session-2',
          message_count: 1,
        });

      await desktopMateAdapter.addChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        messages: mockMessages,
      });

      await desktopMateAdapter.addChatHistory({
        user_id: mockUserId,
        agent_id: mockAgentId,
        messages: [mockMessages[0]],
      });

      // List sessions
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });

      const listResult = await desktopMateAdapter.listSessions({
        user_id: mockUserId,
        agent_id: mockAgentId,
      });

      assert.equal(listResult.sessions.length, 2);
    });

    it('should delete session and verify removal', async () => {
      // Delete session
      vi.mocked(desktopMateAdapter.deleteSession).mockResolvedValue({
        success: true,
        message: 'Deleted',
      });

      const deleteResult = await desktopMateAdapter.deleteSession({
        user_id: mockUserId,
        agent_id: mockAgentId,
        session_id: mockSessionId,
      });

      assert.isTrue(deleteResult.success);

      // List should show one less session
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: [mockSessions[1]],
      });

      const listResult = await desktopMateAdapter.listSessions({
        user_id: mockUserId,
        agent_id: mockAgentId,
      });

      assert.equal(listResult.sessions.length, 1);
      assert.equal(listResult.sessions[0].session_id, 'session-2');
    });

    it('should handle concurrent operations', async () => {
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });

      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: mockSessionId,
        messages: mockMessages,
      });

      // Execute operations concurrently
      const [listResult, historyResult] = await Promise.all([
        desktopMateAdapter.listSessions({
          user_id: mockUserId,
          agent_id: mockAgentId,
        }),
        desktopMateAdapter.getChatHistory({
          user_id: mockUserId,
          agent_id: mockAgentId,
          session_id: mockSessionId,
        }),
      ]);

      assert.equal(listResult.sessions.length, 2);
      assert.equal(historyResult.messages.length, 2);
    });
  });
});
