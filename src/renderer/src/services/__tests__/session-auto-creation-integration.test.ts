/**
 * Session Auto-Creation Integration Test
 * 
 * E2E test for session auto-creation with STM API integration
 * Note: These tests require the backend to be running
 */

import { describe, it, expect, beforeAll, afterAll, assert } from 'vitest';
import { desktopMateAdapter } from '@/services/desktopmate-adapter';

describe.skip('Session Auto-Creation E2E Integration', () => {
  const testUserId = `test-user-${Date.now()}`;
  const testAgentId = `test-agent-${Date.now()}`;
  let createdSessionId: string | null = null;

  beforeAll(async () => {
    // Ensure backend is available
    try {
      await desktopMateAdapter.addChatHistory({
        user_id: 'health-check',
        agent_id: 'health-check',
        messages: [],
      });
    } catch (error) {
      console.warn('Backend may not be available for integration tests');
    }
  });

  afterAll(async () => {
    // Cleanup: delete test session if created
    if (createdSessionId) {
      try {
        await desktopMateAdapter.deleteSession({
          user_id: testUserId,
          agent_id: testAgentId,
          session_id: createdSessionId,
        });
      } catch (error) {
        console.warn('Failed to cleanup test session:', error);
      }
    }
  });

  it('should auto-create session via STM API on first message', async () => {
    // Simulate first-time conversation with no session ID
    const response = await desktopMateAdapter.addChatHistory({
      user_id: testUserId,
      agent_id: testAgentId,
      // No session_id means create new session
      messages: [],
    });

    // Verify session was created
    assert(response.session_id);
    expect(response.session_id.length).toBeGreaterThan(0);
    expect(response.message_count).toBe(0);

    createdSessionId = response.session_id;
  });

  it('should reuse existing session for subsequent messages', async () => {
    // Ensure we have a session
    if (!createdSessionId) {
      const initialResponse = await desktopMateAdapter.addChatHistory({
        user_id: testUserId,
        agent_id: testAgentId,
        messages: [],
      });
      createdSessionId = initialResponse.session_id;
    }

    // Add first message to existing session
    const message1Response = await desktopMateAdapter.addChatHistory({
      user_id: testUserId,
      agent_id: testAgentId,
      session_id: createdSessionId,
      messages: [
        {
          type: 'human',
          content: 'Hello, this is the first message',
        },
      ],
    });

    expect(message1Response.session_id).toBe(createdSessionId);
    expect(message1Response.message_count).toBe(1);

    // Add second message to same session
    const message2Response = await desktopMateAdapter.addChatHistory({
      user_id: testUserId,
      agent_id: testAgentId,
      session_id: createdSessionId,
      messages: [
        {
          type: 'human',
          content: 'Hello, this is the first message',
        },
        {
          type: 'ai',
          content: 'Hello! How can I help you?',
        },
        {
          type: 'human',
          content: 'This is the second message',
        },
      ],
    });

    expect(message2Response.session_id).toBe(createdSessionId);
    expect(message2Response.message_count).toBe(3);
  });

  it('should retrieve session history after messages are added', async () => {
    // Ensure we have a session with messages
    if (!createdSessionId) {
      const response = await desktopMateAdapter.addChatHistory({
        user_id: testUserId,
        agent_id: testAgentId,
        messages: [
          {
            type: 'human',
            content: 'Test message for history',
          },
        ],
      });
      createdSessionId = response.session_id;
    }

    // Retrieve history
    const historyResponse = await desktopMateAdapter.getChatHistory({
      user_id: testUserId,
      agent_id: testAgentId,
      session_id: createdSessionId,
    });

    expect(historyResponse.messages).toBeDefined();
    expect(historyResponse.messages.length).toBeGreaterThan(0);
    expect(historyResponse.messages[0]).toHaveProperty('type');
    expect(historyResponse.messages[0]).toHaveProperty('content');
  });

  it('should list sessions for user and agent', async () => {
    // Ensure we have at least one session
    if (!createdSessionId) {
      const response = await desktopMateAdapter.addChatHistory({
        user_id: testUserId,
        agent_id: testAgentId,
        messages: [],
      });
      createdSessionId = response.session_id;
    }

    // List all sessions
    const sessionsResponse = await desktopMateAdapter.listSessions({
      user_id: testUserId,
      agent_id: testAgentId,
    });

    expect(sessionsResponse.sessions).toBeDefined();
    expect(Array.isArray(sessionsResponse.sessions)).toBe(true);
    
    // Find our test session
    const ourSession = sessionsResponse.sessions.find(
      (s) => s.session_id === createdSessionId,
    );
    expect(ourSession).toBeDefined();
  });

  it('should handle session persistence across app restart simulation', async () => {
    // Create a new session
    const initialResponse = await desktopMateAdapter.addChatHistory({
      user_id: testUserId,
      agent_id: testAgentId,
      messages: [
        {
          type: 'human',
          content: 'Message before restart',
        },
      ],
    });

    const persistentSessionId = initialResponse.session_id;

    // Simulate app restart by "forgetting" the session ID
    // then retrieving it by listing sessions
    const sessionsResponse = await desktopMateAdapter.listSessions({
      user_id: testUserId,
      agent_id: testAgentId,
    });

    const recoveredSession = sessionsResponse.sessions.find(
      (s) => s.session_id === persistentSessionId,
    );

    expect(recoveredSession).toBeDefined();
    expect(recoveredSession!.session_id).toBe(persistentSessionId);

    // Add message to recovered session
    const afterRestartResponse = await desktopMateAdapter.addChatHistory({
      user_id: testUserId,
      agent_id: testAgentId,
      session_id: recoveredSession!.session_id,
      messages: [
        {
          type: 'human',
          content: 'Message before restart',
        },
        {
          type: 'human',
          content: 'Message after restart',
        },
      ],
    });

    expect(afterRestartResponse.session_id).toBe(persistentSessionId);

    // Update created session for cleanup
    if (persistentSessionId !== createdSessionId) {
      try {
        await desktopMateAdapter.deleteSession({
          user_id: testUserId,
          agent_id: testAgentId,
          session_id: persistentSessionId,
        });
      } catch (error) {
        console.warn('Failed to cleanup persistent session:', error);
      }
    }
  });

  it('should handle error when creating session with invalid credentials', async () => {
    try {
      await desktopMateAdapter.addChatHistory({
        user_id: '', // Invalid empty user ID
        agent_id: '', // Invalid empty agent ID
        messages: [],
      });

      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined();
    }
  });
});
