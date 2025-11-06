/**
 * Message Validator Tests
 *
 * Tests for message validation and sanitization functionality
 */

import { describe, it, assert } from 'vitest';
import {
  MessageValidator,
  validateServerMessage,
  sanitizeText,
  sanitizeObject,
} from '../message-validator';
import { MessageType } from '../message-types';

describe('Message Validator', () => {
  describe('Base Message Validation', () => {
    it('should validate a valid base message', () => {
      const msg = {
        type: 'test',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateBaseMessage(msg);
      assert.isTrue(result.valid);
      assert.equal(result.errors.length, 0);
    });

    it('should reject non-object messages', () => {
      const msg = 'not an object';

      const result = MessageValidator.validateBaseMessage(msg);
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'must be an object');
    });

    it('should reject messages without type', () => {
      const msg = {
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateBaseMessage(msg);
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'type');
    });

    it('should reject messages with invalid timestamp', () => {
      const msg = {
        type: 'test',
        timestamp: 'invalid',
      };

      const result = MessageValidator.validateBaseMessage(msg);
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'Timestamp');
    });
  });

  describe('Text Sanitization', () => {
    it('should sanitize normal text', () => {
      const text = 'Hello, world!';
      const sanitized = sanitizeText(text);
      
      assert.equal(sanitized, 'Hello, world!');
    });

    it('should remove null bytes', () => {
      const text = 'Hello\x00World';
      const sanitized = sanitizeText(text);
      
      assert.equal(sanitized, 'HelloWorld');
      assert.notInclude(sanitized, '\x00');
    });

    it('should remove control characters', () => {
      const text = 'Hello\x01\x02\x03World';
      const sanitized = sanitizeText(text);
      
      assert.equal(sanitized, 'HelloWorld');
    });

    it('should preserve newlines and tabs', () => {
      const text = 'Hello\nWorld\tTest';
      const sanitized = sanitizeText(text);
      
      assert.equal(sanitized, 'Hello\nWorld\tTest');
    });

    it('should limit text length', () => {
      const longText = 'a'.repeat(200);
      const sanitized = sanitizeText(longText, 100);
      
      assert.equal(sanitized.length, 100);
    });

    it('should handle non-string input', () => {
      const sanitized = sanitizeText(123 as any);
      
      assert.equal(sanitized, '');
    });

    it('should handle unicode characters', () => {
      const text = 'Hello 世界 🌍';
      const sanitized = sanitizeText(text);
      
      assert.equal(sanitized, 'Hello 世界 🌍');
    });
  });

  describe('Object Sanitization', () => {
    it('should sanitize object with string values', () => {
      const obj = {
        name: 'Test\x00Name',
        message: 'Hello\x01World',
      };

      const sanitized = sanitizeObject(obj);
      
      assert.equal(sanitized.name, 'TestName');
      assert.equal(sanitized.message, 'HelloWorld');
    });

    it('should recursively sanitize nested objects', () => {
      const obj = {
        user: {
          name: 'Test\x00User',
          metadata: {
            desc: 'Desc\x01ription',
          },
        },
      };

      const sanitized = sanitizeObject(obj);
      
      assert.equal(sanitized.user.name, 'TestUser');
      assert.equal(sanitized.user.metadata.desc, 'Description');
    });

    it('should sanitize arrays', () => {
      const obj = {
        items: ['Item\x001', 'Item\x012'],
      };

      const sanitized = sanitizeObject(obj);
      
      assert.equal(sanitized.items[0], 'Item1');
      assert.equal(sanitized.items[1], 'Item2');
    });

    it('should respect max depth', () => {
      const deepObj = {
        level1: {
          level2: {
            level3: {
              value: 'test\x00',
            },
          },
        },
      };

      const sanitized = sanitizeObject(deepObj, 2);
      
      // Should not sanitize beyond depth 2
      assert.isDefined(sanitized.level1.level2);
    });

    it('should preserve numbers and booleans', () => {
      const obj = {
        count: 42,
        active: true,
        ratio: 3.14,
      };

      const sanitized = sanitizeObject(obj);
      
      assert.equal(sanitized.count, 42);
      assert.equal(sanitized.active, true);
      assert.equal(sanitized.ratio, 3.14);
    });
  });

  describe('Authorize Success Validation', () => {
    it('should validate valid authorize_success message', () => {
      const msg = {
        type: MessageType.AUTHORIZE_SUCCESS,
        connection_id: 'conn-123',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateAuthorizeSuccess(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.errors.length, 0);
      assert.isDefined(result.sanitized);
      assert.equal(result.sanitized.connection_id, 'conn-123');
    });

    it('should reject missing connection_id', () => {
      const msg = {
        type: MessageType.AUTHORIZE_SUCCESS,
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateAuthorizeSuccess(msg);
      
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'connection_id');
    });

    it('should sanitize connection_id', () => {
      const msg = {
        type: MessageType.AUTHORIZE_SUCCESS,
        connection_id: 'conn\x00-123',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateAuthorizeSuccess(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.connection_id, 'conn-123');
    });
  });

  describe('Authorize Error Validation', () => {
    it('should validate valid authorize_error message', () => {
      const msg = {
        type: MessageType.AUTHORIZE_ERROR,
        error: 'Invalid token',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateAuthorizeError(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.errors.length, 0);
      assert.isDefined(result.sanitized);
    });

    it('should reject missing error field', () => {
      const msg = {
        type: MessageType.AUTHORIZE_ERROR,
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateAuthorizeError(msg);
      
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'error');
    });
  });

  describe('Chat Response Validation', () => {
    it('should validate valid chat_response message', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'Hello, user!',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateChatResponse(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.errors.length, 0);
      assert.equal(result.sanitized.content, 'Hello, user!');
    });

    it('should validate chat_response with metadata', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'Hello!',
        metadata: {
          turn_id: 'turn-123',
          conversation_id: 'conv-456',
        },
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateChatResponse(msg);
      
      assert.isTrue(result.valid);
      assert.isDefined(result.sanitized.metadata);
      assert.equal(result.sanitized.metadata.turn_id, 'turn-123');
    });

    it('should reject missing content', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateChatResponse(msg);
      
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'content');
    });

    it('should reject invalid metadata', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'Hello!',
        metadata: 'not an object',
      };

      const result = MessageValidator.validateChatResponse(msg);
      
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'metadata');
    });
  });

  describe('Stream Token Validation', () => {
    it('should validate valid stream_token message', () => {
      const msg = {
        type: MessageType.STREAM_TOKEN,
        chunk: 'Hello',
        turn_id: 'turn-123',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateStreamToken(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.chunk, 'Hello');
    });

    it('should handle token field', () => {
      const msg = {
        type: MessageType.STREAM_TOKEN,
        token: 'Hello',
        turn_id: 'turn-123',
      };

      const result = MessageValidator.validateStreamToken(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.token, 'Hello');
    });

    it('should sanitize chunk content', () => {
      const msg = {
        type: MessageType.STREAM_TOKEN,
        chunk: 'Hello\x00World',
        turn_id: 'turn-123',
      };

      const result = MessageValidator.validateStreamToken(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.chunk, 'HelloWorld');
    });
  });

  describe('Error Message Validation', () => {
    it('should validate valid error message', () => {
      const msg = {
        type: MessageType.ERROR,
        error: 'Something went wrong',
        code: 500,
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateError(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.error, 'Something went wrong');
      assert.equal(result.sanitized.code, 500);
    });

    it('should validate error with message field', () => {
      const msg = {
        type: MessageType.ERROR,
        message: 'Error occurred',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateError(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.message, 'Error occurred');
    });

    it('should reject invalid error code', () => {
      const msg = {
        type: MessageType.ERROR,
        error: 'Error',
        code: 'invalid',
      };

      const result = MessageValidator.validateError(msg);
      
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'code');
    });
  });

  describe('TTS Ready Chunk Validation', () => {
    it('should validate valid tts_ready_chunk message', () => {
      const msg = {
        type: MessageType.TTS_READY_CHUNK,
        chunk: 'Hello, world!',
        emotion: 'happy',
        turn_id: 'turn-123',
        timestamp: Date.now(),
      };

      const result = MessageValidator.validateTTSReadyChunk(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.chunk, 'Hello, world!');
      assert.equal(result.sanitized.emotion, 'happy');
    });

    it('should handle audio_chunk field', () => {
      const msg = {
        type: MessageType.TTS_READY_CHUNK,
        audio_chunk: 'base64data',
        chunk_index: 0,
        total_chunks: 10,
      };

      const result = MessageValidator.validateTTSReadyChunk(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.audio_chunk, 'base64data');
    });

    it('should reject invalid chunk_index', () => {
      const msg = {
        type: MessageType.TTS_READY_CHUNK,
        chunk: 'Hello',
        chunk_index: 'invalid',
      };

      const result = MessageValidator.validateTTSReadyChunk(msg);
      
      assert.isFalse(result.valid);
      assert.include(result.errors[0], 'chunk_index');
    });
  });

  describe('Server Message Validation', () => {
    it('should validate PING message', () => {
      const msg = {
        type: MessageType.PING,
        timestamp: Date.now(),
      };

      const result = validateServerMessage(msg);
      
      assert.isTrue(result.valid);
      assert.isDefined(result.sanitized);
    });

    it('should validate STREAM_START message', () => {
      const msg = {
        type: MessageType.STREAM_START,
        turn_id: 'turn-123',
        timestamp: Date.now(),
      };

      const result = validateServerMessage(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.turn_id, 'turn-123');
    });

    it('should validate STREAM_END message', () => {
      const msg = {
        type: MessageType.STREAM_END,
        turn_id: 'turn-123',
        timestamp: Date.now(),
      };

      const result = validateServerMessage(msg);
      
      assert.isTrue(result.valid);
    });

    it('should handle unknown message types with generic sanitization', () => {
      const msg = {
        type: 'unknown_type',
        data: 'test\x00data',
        timestamp: Date.now(),
      };

      const result = validateServerMessage(msg);
      
      assert.isTrue(result.valid);
      assert.equal(result.sanitized.data, 'testdata');
    });

    it('should reject completely invalid messages', () => {
      const msg = null;

      const result = validateServerMessage(msg);
      
      assert.isFalse(result.valid);
      assert.isAbove(result.errors.length, 0);
    });
  });

  describe('Fuzzing and Edge Cases', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(200000);
      const sanitized = sanitizeText(longString);
      
      assert.isAtMost(sanitized.length, 100000);
    });

    it('should handle deeply nested objects', () => {
      const deepObj: any = { value: 'test' };
      let current = deepObj;
      
      for (let i = 0; i < 20; i++) {
        current.nested = { value: `level${i}` };
        current = current.nested;
      }

      const sanitized = sanitizeObject(deepObj, 5);
      
      assert.isDefined(sanitized);
    });

    it('should handle circular references safely', () => {
      const obj: any = { name: 'test' };
      obj.self = obj; // Circular reference

      // Should not throw
      assert.doesNotThrow(() => {
        sanitizeObject(obj, 3);
      });
    });

    it('should handle mixed content arrays', () => {
      const obj = {
        mixed: [
          'string\x00',
          123,
          true,
          null,
          { nested: 'value\x01' },
        ],
      };

      const sanitized = sanitizeObject(obj);
      
      assert.equal(sanitized.mixed[0], 'string');
      assert.equal(sanitized.mixed[1], 123);
      assert.equal(sanitized.mixed[2], true);
      assert.isNull(sanitized.mixed[3]);
      assert.equal(sanitized.mixed[4].nested, 'value');
    });

    it('should handle malicious script injection attempts', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeText(malicious);
      
      // Text sanitization doesn't remove HTML, but ensures no control chars
      assert.isString(sanitized);
      assert.notInclude(sanitized, '\x00');
    });

    it('should handle SQL injection patterns', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = sanitizeText(sqlInjection);
      
      assert.isString(sanitized);
      assert.notInclude(sanitized, '\x00');
    });
  });
});
