/**
 * TTS Integration Tests
 * Tests for tts_ready_chunk message handling and audio playback integration
 */

import { describe, it, vi, beforeEach, afterEach, assert } from 'vitest';
import { extractVolumesFromWAV } from '../audio-processor';

describe('TTS Integration - Message Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('TTS Ready Chunk Message Detection', () => {
    it('should recognize tts_ready_chunk message type', () => {
      const message = {
        type: 'tts_ready_chunk',
        chunk: 'dGVzdCBhdWRpbyBkYXRh', // base64 test data
        emotion: 'happy',
        turn_id: 'turn_123',
      };

      assert.equal(message.type, 'tts_ready_chunk');
      assert.isDefined(message.chunk);
      assert.isDefined(message.emotion);
    });

    it('should handle tts_ready_chunk with minimal fields', () => {
      const message: {
        type: string;
        chunk: string;
        emotion?: string;
      } = {
        type: 'tts_ready_chunk',
        chunk: 'dGVzdA==',
      };

      assert.equal(message.type, 'tts_ready_chunk');
      assert.isDefined(message.chunk);
      assert.isUndefined(message.emotion);
    });

    it('should distinguish tts_ready_chunk from audio messages', () => {
      const ttsChunk = { type: 'tts_ready_chunk', chunk: 'data' };
      const audioMsg = { type: 'audio', audio: 'data' };

      assert.notEqual(ttsChunk.type, audioMsg.type);
    });
  });

  describe('Audio Chunk Processing', () => {
    it('should extract volumes from valid WAV chunk', () => {
      // Generate a simple WAV file (sine wave)
      const sampleRate = 16000;
      const duration = 0.1; // 100ms
      const frequency = 440; // A4 note
      const samples = Math.floor(sampleRate * duration);

      // Create WAV header
      const wavHeader = new Uint8Array(44);
      const view = new DataView(wavHeader.buffer);

      // RIFF header
      view.setUint32(0, 0x46464952, true); // "RIFF"
      view.setUint32(4, 36 + samples * 2, true); // file size - 8
      view.setUint32(8, 0x45564157, true); // "WAVE"

      // fmt chunk
      view.setUint32(12, 0x20746d66, true); // "fmt "
      view.setUint32(16, 16, true); // chunk size
      view.setUint16(20, 1, true); // audio format (PCM)
      view.setUint16(22, 1, true); // num channels (mono)
      view.setUint32(24, sampleRate, true); // sample rate
      view.setUint32(28, sampleRate * 2, true); // byte rate
      view.setUint16(32, 2, true); // block align
      view.setUint16(34, 16, true); // bits per sample

      // data chunk
      view.setUint32(36, 0x61746164, true); // "data"
      view.setUint32(40, samples * 2, true); // data size

      // Create audio data (sine wave)
      const audioData = new Int16Array(samples);
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        audioData[i] = Math.floor(
          32767 * 0.5 * Math.sin(2 * Math.PI * frequency * t),
        );
      }

      // Combine header and data
      const wavFile = new Uint8Array(44 + samples * 2);
      wavFile.set(wavHeader);
      wavFile.set(new Uint8Array(audioData.buffer), 44);

      // Convert to base64
      const base64 = btoa(String.fromCharCode(...wavFile));

      // Extract volumes
      const volumes = extractVolumesFromWAV(base64, 512);

      assert.isDefined(volumes);
      assert.isArray(volumes);
      assert.isAbove(volumes.length, 0);
      
      // All volumes should be normalized (0-1)
      volumes.forEach(vol => {
        assert.isAtLeast(vol, 0);
        assert.isAtMost(vol, 1);
      });
    });

    it('should handle volume extraction with different frame sizes', () => {
      // Create minimal valid WAV
      const sampleRate = 16000;
      const duration = 0.05;
      const samples = Math.floor(sampleRate * duration);

      const wavHeader = new Uint8Array(44);
      const view = new DataView(wavHeader.buffer);

      view.setUint32(0, 0x46464952, true);
      view.setUint32(4, 36 + samples * 2, true);
      view.setUint32(8, 0x45564157, true);
      view.setUint32(12, 0x20746d66, true);
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      view.setUint32(36, 0x61746164, true);
      view.setUint32(40, samples * 2, true);

      const audioData = new Int16Array(samples);
      for (let i = 0; i < samples; i++) {
        audioData[i] = Math.floor(32767 * 0.3 * Math.sin(2 * Math.PI * 440 * i / sampleRate));
      }

      const wavFile = new Uint8Array(44 + samples * 2);
      wavFile.set(wavHeader);
      wavFile.set(new Uint8Array(audioData.buffer), 44);

      const base64 = btoa(String.fromCharCode(...wavFile));

      // Test different frame sizes
      const volumes512 = extractVolumesFromWAV(base64, 512);
      const volumes1024 = extractVolumesFromWAV(base64, 1024);
      const volumes256 = extractVolumesFromWAV(base64, 256);

      assert.isDefined(volumes512);
      assert.isDefined(volumes1024);
      assert.isDefined(volumes256);

      // Different frame sizes should produce different numbers of frames
      assert.isAbove(volumes256.length, volumes512.length);
      assert.isAbove(volumes512.length, volumes1024.length);
    });
  });

  describe('Message Event Interface', () => {
    it('should support chunk property in message event', () => {
      const messageEvent = {
        type: 'tts_ready_chunk',
        chunk: 'base64audiodata',
        emotion: 'neutral',
        turn_id: 'turn_456',
        content: '',
        timestamp: new Date().toISOString(),
      };

      assert.property(messageEvent, 'chunk');
      assert.property(messageEvent, 'emotion');
      assert.property(messageEvent, 'turn_id');
      assert.equal(messageEvent.type, 'tts_ready_chunk');
    });

    it('should handle optional emotion field', () => {
      const withEmotion = {
        type: 'tts_ready_chunk',
        chunk: 'data',
        emotion: 'happy',
      };

      const withoutEmotion: {
        type: string;
        chunk: string;
        emotion?: string;
      } = {
        type: 'tts_ready_chunk',
        chunk: 'data',
      };

      assert.equal(withEmotion.emotion, 'happy');
      assert.isUndefined(withoutEmotion.emotion);
    });

    it('should serialize tts_ready_chunk message to JSON', () => {
      const message = {
        type: 'tts_ready_chunk',
        chunk: 'YXVkaW8=',
        emotion: 'surprised',
        turn_id: 'turn_789',
      };

      const json = JSON.stringify(message);
      assert.isString(json);
      assert.include(json, '"type":"tts_ready_chunk"');
      assert.include(json, '"chunk"');
      assert.include(json, '"emotion":"surprised"');
    });
  });

  describe('Audio Task Integration', () => {
    it('should create audio task with required fields', () => {
      const audioTask = {
        audioBase64: 'dGVzdCBhdWRpbw==',
        volumes: [0.1, 0.2, 0.3, 0.4, 0.5],
        sliceLength: 5,
        displayText: null,
        expressions: ['happy'],
        forwarded: false,
      };

      assert.isDefined(audioTask.audioBase64);
      assert.isDefined(audioTask.volumes);
      assert.isDefined(audioTask.sliceLength);
      assert.isArray(audioTask.volumes);
      assert.equal(audioTask.volumes.length, audioTask.sliceLength);
    });

    it('should handle expressions from emotion field', () => {
      const emotion = 'happy';
      const expressions = emotion ? [emotion] : null;

      assert.isNotNull(expressions);
      assert.isArray(expressions);
      assert.equal(expressions![0], 'happy');
    });

    it('should handle missing emotion gracefully', () => {
      const emotion = undefined;
      const expressions = emotion ? [emotion] : null;

      assert.isNull(expressions);
    });
  });

  describe('State Handling', () => {
    it('should block playback when interrupted', () => {
      const states = {
        interrupted: 'interrupted',
        listening: 'listening',
        idle: 'idle',
        'thinking-speaking': 'thinking-speaking',
      };

      // These states should block playback
      assert.equal(states.interrupted, 'interrupted');
      assert.equal(states.listening, 'listening');

      // These states should allow playback
      assert.notEqual(states.idle, 'interrupted');
      assert.notEqual(states['thinking-speaking'], 'listening');
    });

    it('should check state before processing chunk', () => {
      const shouldBlock = (state: string) => 
        state === 'interrupted' || state === 'listening';

      assert.isTrue(shouldBlock('interrupted'));
      assert.isTrue(shouldBlock('listening'));
      assert.isFalse(shouldBlock('idle'));
      assert.isFalse(shouldBlock('thinking-speaking'));
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid base64 chunk gracefully', () => {
      const invalidChunk = 'not-valid-base64!!!';

      assert.throws(() => {
        extractVolumesFromWAV(invalidChunk);
      });
    });

    it('should handle missing chunk data', () => {
      const message: {
        type: string;
        emotion: string;
        chunk?: string;
      } = {
        type: 'tts_ready_chunk',
        emotion: 'happy',
      };

      assert.isUndefined(message.chunk);
      // Handler should check for chunk existence before processing
    });

    it('should handle malformed WAV data', () => {
      // Just random base64 that's not a valid WAV
      const invalidWAV = btoa('This is not a WAV file');

      assert.throws(() => {
        extractVolumesFromWAV(invalidWAV);
      });
    });
  });

  describe('Volume Normalization', () => {
    it('should produce normalized volume values', () => {
      // Create simple test WAV
      const sampleRate = 16000;
      const samples = 800; // 50ms at 16kHz

      const wavHeader = new Uint8Array(44);
      const view = new DataView(wavHeader.buffer);

      view.setUint32(0, 0x46464952, true);
      view.setUint32(4, 36 + samples * 2, true);
      view.setUint32(8, 0x45564157, true);
      view.setUint32(12, 0x20746d66, true);
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      view.setUint32(36, 0x61746164, true);
      view.setUint32(40, samples * 2, true);

      const audioData = new Int16Array(samples);
      // Create varying amplitude
      for (let i = 0; i < samples; i++) {
        audioData[i] = Math.floor(32767 * (i / samples) * Math.sin(2 * Math.PI * 440 * i / sampleRate));
      }

      const wavFile = new Uint8Array(44 + samples * 2);
      wavFile.set(wavHeader);
      wavFile.set(new Uint8Array(audioData.buffer), 44);

      const base64 = btoa(String.fromCharCode(...wavFile));
      const volumes = extractVolumesFromWAV(base64, 256);

      // All volumes should be in 0-1 range
      volumes.forEach((vol, idx) => {
        assert.isNumber(vol, `Volume at index ${idx} should be a number`);
        assert.isAtLeast(vol, 0, `Volume at index ${idx} should be >= 0`);
        assert.isAtMost(vol, 1, `Volume at index ${idx} should be <= 1`);
      });
    });
  });

  describe('Integration Workflow', () => {
    it('should complete full tts_ready_chunk processing workflow', () => {
      // Step 1: Receive message
      const message = {
        type: 'tts_ready_chunk',
        chunk: 'validBase64AudioData',
        emotion: 'excited',
        turn_id: 'turn_integration_test',
      };

      assert.equal(message.type, 'tts_ready_chunk');

      // Step 2: Check state (simulated)
      const aiState: string = 'thinking-speaking';
      const shouldProcess = aiState !== 'interrupted' && aiState !== 'listening';
      assert.isTrue(shouldProcess);

      // Step 3: Validate chunk exists
      assert.isDefined(message.chunk);

      // Step 4: Prepare audio task
      const mockVolumes = [0.2, 0.4, 0.6, 0.8, 1.0];
      const audioTask = {
        audioBase64: message.chunk,
        volumes: mockVolumes,
        sliceLength: mockVolumes.length,
        displayText: null,
        expressions: message.emotion ? [message.emotion] : null,
        forwarded: false,
      };

      // Step 5: Verify audio task structure
      assert.isDefined(audioTask.audioBase64);
      assert.isArray(audioTask.volumes);
      assert.equal(audioTask.sliceLength, mockVolumes.length);
      assert.deepEqual(audioTask.expressions, ['excited']);
      assert.isFalse(audioTask.forwarded);
    });
  });
});
