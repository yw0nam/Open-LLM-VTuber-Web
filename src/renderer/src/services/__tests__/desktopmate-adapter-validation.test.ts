import { describe, it, beforeEach, assert } from 'vitest';
import { DesktopMateAdapter } from '../desktopmate-adapter';
import { MessageType } from '../message-types';

describe('DesktopMate Adapter - Message Validation Integration', () => {
  let adapter: DesktopMateAdapter;

  beforeEach(() => {
    adapter = new DesktopMateAdapter();
  });

  describe('Valid Message Handling', () => {
    it('should process valid AUTHORIZE_SUCCESS message', () => {
      const msg = {
        type: MessageType.AUTHORIZE_SUCCESS,
        connection_id: 'conn-123',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'authorize_success');
      assert.equal((result.data as any).connection_id, 'conn-123');
    });

    it('should process valid CHAT_RESPONSE message', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'Hello!',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      assert.equal((result.data as any).content, 'Hello!');
    });

    it('should process valid STREAM_TOKEN message', () => {
      const msg = {
        type: MessageType.STREAM_TOKEN,
        chunk: 'test',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'stream_token');
    });

    it('should process valid ERROR message', () => {
      const msg = {
        type: MessageType.ERROR,
        error: 'Test error',
        code: 'TEST_ERROR',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'error');
    });

    it('should process valid TTS_READY_CHUNK message', () => {
      const msg = {
        type: MessageType.TTS_READY_CHUNK,
        audio_chunk: 'base64audiodata',
        chunk_index: 0,
        total_chunks: 5,
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'tts_ready_chunk');
      assert.equal((result.data as any).chunk_index, 0);
    });
  });

  describe('Invalid Message Rejection', () => {
    it('should reject non-object messages', () => {
      const invalidMessages = [
        null,
        undefined,
        'string',
        123,
        [],
        true,
      ];

      invalidMessages.forEach((msg) => {
        const result = adapter.adaptMessage(msg as any);
        
        assert.equal(result.type, 'error');
        assert.include((result.data as any).message, 'Invalid message format');
        assert.equal((result.data as any).code, 'VALIDATION_ERROR');
      });
    });

    it('should reject messages without type field', () => {
      const msg = {
        timestamp: Date.now(),
        content: 'no type',
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
      assert.include((result.data as any).details[0], 'type');
    });

    it('should reject messages with invalid timestamp', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'test',
        timestamp: 'invalid-timestamp',
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
      assert.include(JSON.stringify(result.data), 'Timestamp');
    });

    it('should reject AUTHORIZE_SUCCESS without connection_id', () => {
      const msg = {
        type: MessageType.AUTHORIZE_SUCCESS,
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
      assert.include(JSON.stringify(result.data), 'connection_id');
    });

    it('should reject CHAT_RESPONSE without content', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
      assert.include(JSON.stringify(result.data), 'content');
    });

    it('should reject ERROR without error field', () => {
      const msg = {
        type: MessageType.ERROR,
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
    });

    it('should reject TTS_READY_CHUNK with invalid chunk_index', () => {
      const msg = {
        type: MessageType.TTS_READY_CHUNK,
        audio_chunk: 'data',
        chunk_index: 'invalid',
        total_chunks: 5,
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
    });
  });

  describe('Message Sanitization', () => {
    it('should sanitize text content with null bytes', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'Hello\x00World',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      // Null bytes should be removed
      assert.isFalse((result.data as any).content.includes('\x00'));
    });

    it('should sanitize text content with control characters', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'Hello\x01\x02World',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      // Control characters should be removed
      assert.isFalse((result.data as any).content.includes('\x01'));
      assert.isFalse((result.data as any).content.includes('\x02'));
    });

    it('should sanitize connection_id', () => {
      const msg = {
        type: MessageType.AUTHORIZE_SUCCESS,
        connection_id: 'conn-\x00123\x01abc',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'authorize_success');
      const connId = (result.data as any).connection_id;
      assert.isFalse(connId.includes('\x00'));
      assert.isFalse(connId.includes('\x01'));
    });

    it('should preserve newlines and tabs in content', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'Line1\nLine2\tTabbed',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      assert.include((result.data as any).content, '\n');
      assert.include((result.data as any).content, '\t');
    });

    it('should handle nested objects in metadata', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: 'test',
        metadata: {
          user: 'test\x00user',
          nested: {
            value: 'data\x01here',
          },
        },
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      // Metadata should be sanitized
      const metadata = (result.data as any).metadata;
      if (metadata && metadata.user) {
        assert.isFalse(metadata.user.includes('\x00'));
      }
    });
  });

  describe('Error Handling and Logging', () => {
    it('should include validation errors in response', () => {
      const msg = {
        type: 'invalid_type',
        timestamp: 'bad timestamp',
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
      assert.isArray((result.data as any).details);
      assert.isTrue((result.data as any).details.length > 0);
    });

    it('should include original message in error metadata', () => {
      const msg = {
        invalid: 'structure',
      };

      const result = adapter.adaptMessage(msg as any);
      
      assert.equal(result.type, 'error');
      assert.isDefined(result.metadata);
      assert.isDefined((result.metadata as any).originalMessage);
    });

    it('should handle extremely long text content', () => {
      const longText = 'A'.repeat(150000); // Exceeds max length
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: longText,
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      // Content should be truncated to max length
      const content = (result.data as any).content;
      assert.isTrue(content.length <= 100000);
    });

    it('should handle messages with circular references safely', () => {
      const msg: any = {
        type: MessageType.CHAT_RESPONSE,
        content: 'test',
        timestamp: Date.now(),
        metadata: {},
      };
      // Create circular reference
      msg.metadata.self = msg.metadata;

      // Should not throw error
      const result = adapter.adaptMessage(msg);
      assert.isDefined(result);
    });
  });

  describe('Security and Fuzzing', () => {
    it('should handle malicious script injection attempts', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: '<script>alert("xss")</script>',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      // Note: Basic sanitization removes control chars, not HTML
      // Additional HTML sanitization may be needed at display layer
    });

    it('should handle SQL injection patterns', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: "'; DROP TABLE users; --",
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      // Should process without error
    });

    it('should handle unicode and emoji characters', () => {
      const msg = {
        type: MessageType.CHAT_RESPONSE,
        content: '👋 Hello 世界! 🎉',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg);
      
      assert.equal(result.type, 'chat_response');
      assert.include((result.data as any).content, '👋');
      assert.include((result.data as any).content, '世界');
      assert.include((result.data as any).content, '🎉');
    });
  });

  describe('Unknown Message Types', () => {
    it('should handle unknown message types gracefully', () => {
      const msg = {
        type: 'unknown_custom_type',
        custom_field: 'value',
        timestamp: Date.now(),
      };

      const result = adapter.adaptMessage(msg as any);
      
      // Unknown types should still be processed with generic sanitization
      assert.equal(result.type, 'unknown');
      assert.isDefined(result.data);
    });
  });
});
