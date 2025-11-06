/**
 * Message Persistence Service Tests
 * 
 * Tests for local storage fallback and message synchronization
 */

import { describe, it, beforeEach, assert } from 'vitest';
import {
  saveMessagesToLocal,
  loadMessagesFromLocal,
  clearLocalMessages,
  addToPendingSync,
  getPendingSync,
  removePendingSync,
  hasPendingSync,
} from '../message-persistence';
import type { Message } from '../websocket-service';
import type { STMMessage } from '../config-types';

describe('Message Persistence Service', () => {
  const testSessionId = 'test-session-123';
  const testUserId = 'test-user-456';
  const testAgentId = 'test-agent-789';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Local Storage Operations', () => {
    it('should save messages to local storage', () => {
      const messages: Message[] = [
        {
          id: '1',
          content: 'Hello',
          role: 'human',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          content: 'Hi there!',
          role: 'ai',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
      ];

      saveMessagesToLocal(testSessionId, testUserId, testAgentId, messages);

      const key = `message_history_${testSessionId}`;
      const stored = localStorage.getItem(key);
      
      assert.isDefined(stored);
      const parsed = JSON.parse(stored!);
      assert.equal(parsed.sessionId, testSessionId);
      assert.equal(parsed.userId, testUserId);
      assert.equal(parsed.agentId, testAgentId);
      assert.equal(parsed.messages.length, 2);
      assert.equal(parsed.messages[0].content, 'Hello');
    });

    it('should load messages from local storage', () => {
      const messages: Message[] = [
        {
          id: '1',
          content: 'Test message',
          role: 'human',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
      ];

      saveMessagesToLocal(testSessionId, testUserId, testAgentId, messages);
      const loaded = loadMessagesFromLocal(testSessionId);

      assert.isDefined(loaded);
      assert.equal(loaded!.length, 1);
      assert.equal(loaded![0].content, 'Test message');
      assert.equal(loaded![0].role, 'human');
    });

    it('should return null when loading non-existent session', () => {
      const loaded = loadMessagesFromLocal('non-existent-session');
      assert.isNull(loaded);
    });

    it('should clear local messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          content: 'Test',
          role: 'human',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
      ];

      saveMessagesToLocal(testSessionId, testUserId, testAgentId, messages);
      clearLocalMessages(testSessionId);

      const loaded = loadMessagesFromLocal(testSessionId);
      assert.isNull(loaded);
    });
  });

  describe('Pending Sync Queue', () => {
    it('should add messages to pending sync queue', () => {
      const messages: STMMessage[] = [
        { type: 'human', content: 'Hello' },
        { type: 'ai', content: 'Hi!' },
      ];

      addToPendingSync(testSessionId, testUserId, testAgentId, messages);

      const pending = getPendingSync();
      assert.equal(pending.length, 1);
      assert.equal(pending[0].sessionId, testSessionId);
      assert.equal(pending[0].messages.length, 2);
    });

    it('should merge messages for same session in pending queue', () => {
      const messages1: STMMessage[] = [
        { type: 'human', content: 'First message' },
      ];
      const messages2: STMMessage[] = [
        { type: 'ai', content: 'Second message' },
      ];

      addToPendingSync(testSessionId, testUserId, testAgentId, messages1);
      addToPendingSync(testSessionId, testUserId, testAgentId, messages2);

      const pending = getPendingSync();
      assert.equal(pending.length, 1);
      assert.equal(pending[0].messages.length, 2);
    });

    it('should avoid duplicate messages in pending queue', () => {
      const messages1: STMMessage[] = [
        { type: 'human', content: 'Same message' },
      ];
      const messages2: STMMessage[] = [
        { type: 'human', content: 'Same message' },
      ];

      addToPendingSync(testSessionId, testUserId, testAgentId, messages1);
      addToPendingSync(testSessionId, testUserId, testAgentId, messages2);

      const pending = getPendingSync();
      assert.equal(pending.length, 1);
      assert.equal(pending[0].messages.length, 1);
    });

    it('should handle multiple sessions in pending queue', () => {
      const session1Messages: STMMessage[] = [
        { type: 'human', content: 'Session 1' },
      ];
      const session2Messages: STMMessage[] = [
        { type: 'human', content: 'Session 2' },
      ];

      addToPendingSync('session-1', testUserId, testAgentId, session1Messages);
      addToPendingSync('session-2', testUserId, testAgentId, session2Messages);

      const pending = getPendingSync();
      assert.equal(pending.length, 2);
    });

    it('should remove session from pending sync', () => {
      const messages: STMMessage[] = [
        { type: 'human', content: 'Test' },
      ];

      addToPendingSync(testSessionId, testUserId, testAgentId, messages);
      removePendingSync(testSessionId);

      const pending = getPendingSync();
      assert.equal(pending.length, 0);
    });

    it('should check if pending sync exists', () => {
      assert.isFalse(hasPendingSync());

      const messages: STMMessage[] = [
        { type: 'human', content: 'Test' },
      ];
      addToPendingSync(testSessionId, testUserId, testAgentId, messages);

      assert.isTrue(hasPendingSync());

      removePendingSync(testSessionId);
      assert.isFalse(hasPendingSync());
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in local storage gracefully', () => {
      const key = `message_history_${testSessionId}`;
      localStorage.setItem(key, 'invalid json');

      const loaded = loadMessagesFromLocal(testSessionId);
      assert.isNull(loaded);
    });

    it('should handle invalid JSON in pending sync gracefully', () => {
      localStorage.setItem('pending_sync_messages', 'invalid json');

      const pending = getPendingSync();
      assert.isArray(pending);
      assert.equal(pending.length, 0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete save-load-sync cycle', () => {
      // 1. Save messages locally
      const messages: Message[] = [
        {
          id: '1',
          content: 'Local message',
          role: 'human',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
      ];
      saveMessagesToLocal(testSessionId, testUserId, testAgentId, messages);

      // 2. Add to pending sync
      const stmMessages: STMMessage[] = [
        { type: 'human', content: 'Local message' },
      ];
      addToPendingSync(testSessionId, testUserId, testAgentId, stmMessages);

      // 3. Verify local storage
      const loaded = loadMessagesFromLocal(testSessionId);
      assert.isDefined(loaded);
      assert.equal(loaded!.length, 1);

      // 4. Verify pending sync
      assert.isTrue(hasPendingSync());
      const pending = getPendingSync();
      assert.equal(pending.length, 1);

      // 5. Simulate successful sync
      removePendingSync(testSessionId);
      assert.isFalse(hasPendingSync());
    });

    it('should preserve message order in pending sync', () => {
      const messages: STMMessage[] = [
        { type: 'human', content: 'Message 1' },
        { type: 'ai', content: 'Response 1' },
        { type: 'human', content: 'Message 2' },
        { type: 'ai', content: 'Response 2' },
      ];

      addToPendingSync(testSessionId, testUserId, testAgentId, messages);

      const pending = getPendingSync();
      assert.equal(pending[0].messages.length, 4);
      assert.equal(pending[0].messages[0].content, 'Message 1');
      assert.equal(pending[0].messages[1].content, 'Response 1');
      assert.equal(pending[0].messages[2].content, 'Message 2');
      assert.equal(pending[0].messages[3].content, 'Response 2');
    });
  });
});
