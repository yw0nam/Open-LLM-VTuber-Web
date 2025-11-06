/**
 * Message Formatter Tests
 *
 * Tests for message validation and formatting functionality
 */

import { describe, it, expect } from 'vitest';
import {
  MessageFormatter,
  validateMessage,
  validateSessionMetadata,
  formatMessage,
  validateAndFormat,
} from '../message-formatter';
import type { UserMessageInput, SessionMetadata } from '../message-formatter';
import { MessageType } from '../message-types';

describe('Message Formatter', () => {
  describe('Message Validation', () => {
    it('should validate a valid message', () => {
      const input: UserMessageInput = {
        text: 'Hello, world!',
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty message', () => {
      const input: UserMessageInput = {
        text: '',
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject whitespace-only message', () => {
      const input: UserMessageInput = {
        text: '   \n\t  ',
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject message exceeding max length', () => {
      const input: UserMessageInput = {
        text: 'a'.repeat(10001),
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('maximum length');
    });

    it('should reject non-string message', () => {
      const input: any = {
        text: 12345,
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be a string');
    });

    it('should reject missing text field', () => {
      const input: any = {};

      const result = validateMessage(input);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should validate message with images', () => {
      const input: UserMessageInput = {
        text: 'Check out these images',
        images: ['https://example.com/image1.jpg', 'data:image/png;base64,abc123'],
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid images array', () => {
      const input: any = {
        text: 'Hello',
        images: 'not-an-array',
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('array');
    });

    it('should reject empty string in images array', () => {
      const input: UserMessageInput = {
        text: 'Hello',
        images: ['https://example.com/image1.jpg', ''],
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid non-empty');
    });
  });

  describe('Session Metadata Validation', () => {
    it('should validate complete session metadata', () => {
      const metadata: SessionMetadata = {
        userId: 'user-123',
        agentId: 'agent-456',
        sessionId: 'session-789',
      };

      const result = validateSessionMetadata(metadata);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate metadata without sessionId', () => {
      const metadata: SessionMetadata = {
        userId: 'user-123',
        agentId: 'agent-456',
      };

      const result = validateSessionMetadata(metadata);
      expect(result.valid).toBe(true);
    });

    it('should reject missing userId', () => {
      const metadata: any = {
        agentId: 'agent-456',
      };

      const result = validateSessionMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('User ID');
    });

    it('should reject missing agentId', () => {
      const metadata: any = {
        userId: 'user-123',
      };

      const result = validateSessionMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Agent ID');
    });

    it('should reject non-string userId', () => {
      const metadata: any = {
        userId: 123,
        agentId: 'agent-456',
      };

      const result = validateSessionMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('User ID');
    });

    it('should reject non-string sessionId', () => {
      const metadata: any = {
        userId: 'user-123',
        agentId: 'agent-456',
        sessionId: 12345,
      };

      const result = validateSessionMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Session ID');
    });

    it('should accept null sessionId', () => {
      const metadata: SessionMetadata = {
        userId: 'user-123',
        agentId: 'agent-456',
        sessionId: null as any,
      };

      const result = validateSessionMetadata(metadata);
      expect(result.valid).toBe(true);
    });
  });

  describe('Message Formatting', () => {
    it('should format a basic message correctly', () => {
      const input: UserMessageInput = {
        text: 'Hello, AI!',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
        sessionId: 'session-001',
      };

      const message = formatMessage(input, metadata);

      expect(message.type).toBe(MessageType.CHAT_MESSAGE);
      expect(message.content).toBe('Hello, AI!');
      expect(message.user_id).toBe('user-001');
      expect(message.agent_id).toBe('agent-001');
      expect(message.conversation_id).toBe('session-001');
      expect(message.timestamp).toBeDefined();
      expect(typeof message.timestamp).toBe('number');
    });

    it('should format message with images', () => {
      const input: UserMessageInput = {
        text: 'Look at this',
        images: ['https://example.com/image.jpg'],
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      const message = formatMessage(input, metadata);

      expect(message.content).toBe('Look at this');
      expect(message.images).toEqual(['https://example.com/image.jpg']);
    });

    it('should format message without sessionId', () => {
      const input: UserMessageInput = {
        text: 'New conversation',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      const message = formatMessage(input, metadata);

      expect(message.content).toBe('New conversation');
      expect(message.conversation_id).toBeUndefined();
    });

    it('should include optional persona', () => {
      const input: UserMessageInput = {
        text: 'Hello',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
        persona: 'friendly-assistant',
      };

      const message = formatMessage(input, metadata);

      expect(message.persona).toBe('friendly-assistant');
    });

    it('should include optional metadata', () => {
      const input: UserMessageInput = {
        text: 'Hello',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
        metadata: {
          source: 'web',
          version: '1.0',
        },
      };

      const message = formatMessage(input, metadata);

      expect(message.metadata).toEqual({
        source: 'web',
        version: '1.0',
      });
    });

    it('should trim message text', () => {
      const input: UserMessageInput = {
        text: '  Hello, world!  \n',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      const message = formatMessage(input, metadata);

      expect(message.content).toBe('Hello, world!');
    });

    it('should throw error for invalid input', () => {
      const input: UserMessageInput = {
        text: '',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      expect(() => formatMessage(input, metadata)).toThrow('Invalid message input');
    });

    it('should throw error for invalid metadata', () => {
      const input: UserMessageInput = {
        text: 'Hello',
      };

      const metadata: any = {
        userId: 'user-001',
        // Missing agentId
      };

      expect(() => formatMessage(input, metadata)).toThrow('Invalid session metadata');
    });
  });

  describe('Validate and Format Combined', () => {
    it('should validate and format valid message', () => {
      const input: UserMessageInput = {
        text: 'Test message',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
        sessionId: 'session-001',
      };

      const result = validateAndFormat(input, metadata);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.message).toBeDefined();
      expect(result.message?.content).toBe('Test message');
    });

    it('should return error for invalid input', () => {
      const input: UserMessageInput = {
        text: '',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      const result = validateAndFormat(input, metadata);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toBeUndefined();
    });

    it('should return error for invalid metadata', () => {
      const input: UserMessageInput = {
        text: 'Hello',
      };

      const metadata: any = {
        userId: 'user-001',
        // Missing agentId
      };

      const result = validateAndFormat(input, metadata);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toBeUndefined();
    });
  });

  describe('Static Class Methods', () => {
    it('should work via static class methods', () => {
      const input: UserMessageInput = {
        text: 'Static method test',
      };

      const result = MessageFormatter.validateMessage(input);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long valid message', () => {
      const input: UserMessageInput = {
        text: 'a'.repeat(10000),
      };

      const result = validateMessage(input);
      expect(result.valid).toBe(true);
    });

    it('should handle single character message', () => {
      const input: UserMessageInput = {
        text: 'a',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      const message = formatMessage(input, metadata);
      expect(message.content).toBe('a');
    });

    it('should handle unicode characters', () => {
      const input: UserMessageInput = {
        text: '你好，世界！ 🌍',
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      const message = formatMessage(input, metadata);
      expect(message.content).toBe('你好，世界！ 🌍');
    });

    it('should handle multiple images', () => {
      const input: UserMessageInput = {
        text: 'Multiple images',
        images: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'data:image/png;base64,abc123',
        ],
      };

      const metadata: SessionMetadata = {
        userId: 'user-001',
        agentId: 'agent-001',
      };

      const message = formatMessage(input, metadata);
      expect(message.images).toHaveLength(3);
    });
  });
});
