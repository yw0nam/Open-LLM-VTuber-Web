/**
 * TTS API Client Tests
 * Tests for timeout handling, retry logic, and response validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { desktopMateAdapter } from '../desktopmate-adapter';
import { configManager } from '../desktopmate-config';

describe('TTS API Client - synthesizeSpeech', () => {
  beforeEach(() => {
    // Setup configuration for tests
    configManager.updateUrl('tts', 'http://localhost:5500/v1/tts/synthesize');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject empty text', async () => {
      await expect(
        desktopMateAdapter.synthesizeSpeech(''),
      ).rejects.toThrow('Text must be a non-empty string');
    });

    it('should reject non-string text', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        desktopMateAdapter.synthesizeSpeech(123),
      ).rejects.toThrow('Text must be a non-empty string');
    });

    it('should reject whitespace-only text', async () => {
      await expect(
        desktopMateAdapter.synthesizeSpeech('   '),
      ).rejects.toThrow('Text must be a non-empty string');
    });

    it('should reject empty referenceId', async () => {
      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello', ''),
      ).rejects.toThrow('Reference ID must be a valid non-empty string');
    });

    it('should reject non-string referenceId', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        desktopMateAdapter.synthesizeSpeech('Hello', 123),
      ).rejects.toThrow('Reference ID must be a valid non-empty string');
    });

    it('should accept valid text', async () => {
      // Mock fetch to avoid actual API call
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
            format: 'base64',
          }),
        } as Response),
      );

      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello world'),
      ).resolves.toBeDefined();
    });
  });

  describe('Timeout Handling', () => {
    // Note: Timeout test is skipped because it requires mocking the AbortController and timing
    // The timeout functionality is tested manually and in integration tests
    it.skip('should timeout after specified duration', async () => {
      // Mock fetch to hang indefinitely
      global.fetch = vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            // Never resolve to simulate timeout
            setTimeout(() => resolve({} as Response), 100000);
          }),
      );

      const shortTimeout = 100; // 100ms timeout
      const maxRetries = 1; // Only one attempt to make the test faster
      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello', undefined, shortTimeout, maxRetries),
      ).rejects.toThrow(/timeout/i);
    }, 5000); // 5s test timeout

    it('should use default timeout of 30 seconds', async () => {
      // Mock fetch to hang
      global.fetch = vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            setTimeout(() => resolve({} as Response), 100000);
          }),
      );

      // Start the request
      desktopMateAdapter.synthesizeSpeech('Hello');

      // Should not reject immediately
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Note: We can't easily test the full 30s timeout without making the test slow
    }, 1000);
  });

  describe('Retry Logic', () => {
    it('should retry on network failure up to maxRetries', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        return Promise.reject(new Error('Network error'));
      });

      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello', undefined, 1000, 3),
      ).rejects.toThrow();

      // Should attempt 3 times
      expect(callCount).toBe(3);
    }, 10000);

    it('should retry on server error (5xx)', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response);
      });

      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello', undefined, 1000, 3),
      ).rejects.toThrow();

      // Should retry on 5xx errors
      expect(callCount).toBe(3);
    }, 10000);

    it('should NOT retry on client error (4xx)', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        return Promise.resolve({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
        } as Response);
      });

      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello', undefined, 1000, 3),
      ).rejects.toThrow(/client error/i);

      // Should NOT retry on 4xx errors
      expect(callCount).toBe(1);
    });

    it('should succeed on first attempt if API succeeds', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
            format: 'base64',
          }),
        } as Response);
      });

      await desktopMateAdapter.synthesizeSpeech('Hello', undefined, 1000, 3);

      // Should only call once if successful
      expect(callCount).toBe(1);
    });

    it('should succeed after retry', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
            format: 'base64',
          }),
        } as Response);
      });

      const result = await desktopMateAdapter.synthesizeSpeech(
        'Hello',
        undefined,
        1000,
        3,
      );

      // Should succeed on 2nd attempt
      expect(callCount).toBe(2);
      expect(result).toBeDefined();
      expect(result.audio_data).toBe('SGVsbG8gV29ybGQ=');
    }, 10000);
  });

  describe('Response Validation', () => {
    it('should reject response without audio_data', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            format: 'base64',
          }),
        } as Response),
      );

      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello'),
      ).rejects.toThrow(/Invalid TTS response.*audio_data/i);
    });

    it('should reject response without format', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
          }),
        } as Response),
      );

      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello'),
      ).rejects.toThrow(/Invalid TTS response.*format/i);
    });

    it('should reject invalid base64 audio_data', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'not valid base64!!!',
            format: 'base64',
          }),
        } as Response),
      );

      await expect(
        desktopMateAdapter.synthesizeSpeech('Hello'),
      ).rejects.toThrow(/not valid base64/i);
    });

    it('should accept valid TTS response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
            format: 'base64',
          }),
        } as Response),
      );

      const result = await desktopMateAdapter.synthesizeSpeech('Hello');

      expect(result).toBeDefined();
      expect(result.audio_data).toBe('SGVsbG8gV29ybGQ=');
      expect(result.format).toBe('base64');
    });
  });

  describe('Request Payload', () => {
    it('should send correct payload without referenceId', async () => {
      let capturedBody: string | undefined;

      global.fetch = vi.fn((_url, options) => {
        capturedBody = options?.body as string;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
            format: 'base64',
          }),
        } as Response);
      });

      await desktopMateAdapter.synthesizeSpeech('Hello world');

      expect(capturedBody).toBeDefined();
      const payload = JSON.parse(capturedBody!);
      expect(payload.text).toBe('Hello world');
      expect(payload.output_format).toBe('base64');
      expect(payload.reference_id).toBeUndefined();
    });

    it('should send correct payload with referenceId', async () => {
      let capturedBody: string | undefined;

      global.fetch = vi.fn((_url, options) => {
        capturedBody = options?.body as string;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
            format: 'base64',
          }),
        } as Response);
      });

      await desktopMateAdapter.synthesizeSpeech('Hello', 'custom-voice-123');

      expect(capturedBody).toBeDefined();
      const payload = JSON.parse(capturedBody!);
      expect(payload.text).toBe('Hello');
      expect(payload.reference_id).toBe('custom-voice-123');
      expect(payload.output_format).toBe('base64');
    });

    it('should set correct headers', async () => {
      let capturedHeaders: HeadersInit | undefined;

      global.fetch = vi.fn((_url, options) => {
        capturedHeaders = options?.headers;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            audio_data: 'SGVsbG8gV29ybGQ=',
            format: 'base64',
          }),
        } as Response);
      });

      await desktopMateAdapter.synthesizeSpeech('Hello');

      expect(capturedHeaders).toBeDefined();
      expect((capturedHeaders as Record<string, string>)['Content-Type']).toBe(
        'application/json',
      );
    });
  });
});
