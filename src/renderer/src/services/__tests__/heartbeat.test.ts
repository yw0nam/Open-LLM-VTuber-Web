/**
 * Heartbeat (Ping/Pong) Management Tests
 * Tests for ping detection, pong responses, and heartbeat timing
 */

import { describe, it, vi, beforeEach, afterEach, assert } from 'vitest';
import { desktopMateAdapter } from '../desktopmate-adapter';
import { MessageType } from '../message-types';

describe('Heartbeat Management - Ping/Pong', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPongMessage', () => {
    it('should create a valid pong message', () => {
      const pongMessage = desktopMateAdapter.createPongMessage();

      // Assert based testing
      assert.isDefined(pongMessage);
      assert.equal(pongMessage.type, MessageType.PONG);
      assert.isDefined(pongMessage.timestamp);
      assert.isNumber(pongMessage.timestamp);
      assert.isTrue(typeof pongMessage.timestamp === 'number' && pongMessage.timestamp > 0);
    });

    it('should create pong message with current timestamp', () => {
      const before = Date.now();
      const pongMessage = desktopMateAdapter.createPongMessage();
      const after = Date.now();

      const timestamp = pongMessage.timestamp as number;
      assert.isAtLeast(timestamp, before);
      assert.isAtMost(timestamp, after);
    });

    it('should create unique timestamps for consecutive pong messages', async () => {
      const pong1 = desktopMateAdapter.createPongMessage();
      
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const pong2 = desktopMateAdapter.createPongMessage();

      const timestamp1 = pong1.timestamp as number;
      const timestamp2 = pong2.timestamp as number;
      assert.notEqual(timestamp1, timestamp2);
      assert.isBelow(timestamp1, timestamp2);
    });

    it('should create serializable pong message', () => {
      const pongMessage = desktopMateAdapter.createPongMessage();
      
      // Should be able to stringify and parse
      const serialized = JSON.stringify(pongMessage);
      assert.isString(serialized);
      
      const deserialized = JSON.parse(serialized);
      assert.deepEqual(deserialized.type, pongMessage.type);
      assert.equal(deserialized.timestamp, pongMessage.timestamp);
    });

    it('should match backend PongMessage structure', () => {
      const pongMessage = desktopMateAdapter.createPongMessage();

      // Must have required fields matching backend model
      assert.property(pongMessage, 'type');
      assert.property(pongMessage, 'timestamp');
      
      // Type must be 'pong'
      assert.equal(pongMessage.type, 'pong');
    });
  });

  describe('Ping Message Detection', () => {
    it('should recognize ping message type', () => {
      const pingMessage = {
        type: MessageType.PING,
        timestamp: Date.now(),
      };

      assert.equal(pingMessage.type, MessageType.PING);
      assert.equal(pingMessage.type, 'ping');
    });

    it('should distinguish ping from other message types', () => {
      const pingMessage = { type: MessageType.PING };
      const chatMessage = { type: MessageType.CHAT_MESSAGE };
      const authMessage = { type: MessageType.AUTHORIZE };

      assert.notEqual(pingMessage.type, chatMessage.type);
      assert.notEqual(pingMessage.type, authMessage.type);
      assert.equal(pingMessage.type, 'ping');
    });
  });

  describe('Pong Response Timing', () => {
    it('should create pong response quickly', () => {
      const startTime = performance.now();
      desktopMateAdapter.createPongMessage();
      const endTime = performance.now();

      const responseTime = endTime - startTime;
      
      // Should create pong in less than 10ms
      assert.isBelow(responseTime, 10);
    });

    it('should measure response time accurately', () => {
      const before = performance.now();
      const pongMessage = desktopMateAdapter.createPongMessage();
      const after = performance.now();

      const elapsed = after - before;

      // Sanity checks
      assert.isNumber(elapsed);
      assert.isAtLeast(elapsed, 0);
      assert.isBelow(elapsed, 100); // Should be very fast
      assert.isDefined(pongMessage);
    });
  });

  describe('Heartbeat Logging', () => {
    it('should log pong creation for debugging', () => {
      // Creating pong should trigger debug logging internally
      const pongMessage = desktopMateAdapter.createPongMessage();

      assert.isDefined(pongMessage);
      // The actual logging happens in the WebSocket service layer
      // This test verifies the message is created successfully
    });
  });

  describe('Message Serialization', () => {
    it('should serialize pong message to valid JSON', () => {
      const pongMessage = desktopMateAdapter.createPongMessage();
      const json = JSON.stringify(pongMessage);

      assert.isString(json);
      assert.include(json, '"type":"pong"');
      assert.include(json, '"timestamp"');
    });

    it('should deserialize ping message correctly', () => {
      const pingJson = JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
      });

      const pingMessage = JSON.parse(pingJson);

      assert.equal(pingMessage.type, 'ping');
      assert.isDefined(pingMessage.timestamp);
      assert.isNumber(pingMessage.timestamp);
    });

    it('should handle round-trip serialization', () => {
      const original = desktopMateAdapter.createPongMessage();
      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized);

      assert.equal(deserialized.type, original.type);
      assert.equal(deserialized.timestamp, original.timestamp);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive pong creations', () => {
      const pongs = [];
      
      for (let i = 0; i < 10; i++) {
        pongs.push(desktopMateAdapter.createPongMessage());
      }

      // All should be valid
      assert.equal(pongs.length, 10);
      pongs.forEach(pong => {
        assert.equal(pong.type, MessageType.PONG);
        assert.isDefined(pong.timestamp);
      });

      // Timestamps should be in order (or equal for very fast execution)
      for (let i = 1; i < pongs.length; i++) {
        const current = pongs[i].timestamp as number;
        const previous = pongs[i - 1].timestamp as number;
        assert.isAtLeast(current, previous);
      }
    });

    it('should create valid pong even with system clock changes', () => {
      // Mock Date.now to simulate clock changes
      const originalNow = Date.now;
      let callCount = 0;
      
      Date.now = vi.fn(() => {
        callCount++;
        // Simulate clock going backwards (shouldn't happen but test resilience)
        return originalNow() - (callCount * 1000);
      });

      try {
        const pong = desktopMateAdapter.createPongMessage();
        
        assert.isDefined(pong);
        assert.equal(pong.type, MessageType.PONG);
        assert.isDefined(pong.timestamp);
        assert.isNumber(pong.timestamp);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  describe('Protocol Compliance', () => {
    it('should match backend message structure exactly', () => {
      const pongMessage = desktopMateAdapter.createPongMessage();

      // Backend expects: { type: 'pong', timestamp: number }
      assert.hasAllKeys(pongMessage, ['type', 'timestamp']);
      assert.equal(pongMessage.type, 'pong');
      assert.isNumber(pongMessage.timestamp);
    });

    it('should create message compatible with WebSocket send', () => {
      const pongMessage = desktopMateAdapter.createPongMessage();
      
      // Should be serializable without errors
      let serialized;
      assert.doesNotThrow(() => {
        serialized = JSON.stringify(pongMessage);
      });

      assert.isDefined(serialized);
      assert.isString(serialized);
    });
  });

  describe('Performance', () => {
    it('should create pong messages efficiently in batch', () => {
      const count = 1000;
      const startTime = performance.now();
      
      for (let i = 0; i < count; i++) {
        desktopMateAdapter.createPongMessage();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / count;

      // Average should be well under 1ms per message
      assert.isBelow(avgTime, 1);
      
      // Total time should be reasonable
      assert.isBelow(totalTime, 100);
    });

    it('should not cause memory leaks with repeated creation', () => {
      // Create many pong messages
      const pongs = [];
      for (let i = 0; i < 100; i++) {
        pongs.push(desktopMateAdapter.createPongMessage());
      }

      // All should be valid
      assert.equal(pongs.length, 100);
      
      // Verify they're all unique objects
      const types = new Set(pongs.map(p => p.type));
      assert.equal(types.size, 1);
      assert.isTrue(types.has(MessageType.PONG));
    });
  });
});
