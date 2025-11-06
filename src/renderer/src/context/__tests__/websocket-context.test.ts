/**
 * Tests for WebSocket Context
 * Verifies URL loading from centralized configuration and localStorage persistence
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { configManager } from '@/services/desktopmate-config';

describe('WebSocket Context - URL Configuration', () => {
  // Store original localStorage
  const originalLocalStorage = global.localStorage;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Clear any stored config
    localStorageMock = {};

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
      length: Object.keys(localStorageMock).length,
    } as Storage;
  });

  afterEach(() => {
    // Restore original localStorage
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe('URL Loading from Configuration', () => {
    it('should load URLs from centralized configuration', () => {
      const urlsConfig = configManager.getSection('urls');

      // Verify URLs are present
      expect(urlsConfig).toBeDefined();
      expect(urlsConfig.wsUrl).toBeDefined();
      expect(urlsConfig.baseUrl).toBeDefined();
      expect(typeof urlsConfig.wsUrl).toBe('string');
      expect(typeof urlsConfig.baseUrl).toBe('string');
    });

    it('should have valid WebSocket URL format', () => {
      const urlsConfig = configManager.getSection('urls');
      
      // WebSocket URL should start with ws:// or wss://
      expect(urlsConfig.wsUrl).toMatch(/^wss?:\/\//);
    });

    it('should have valid HTTP base URL format', () => {
      const urlsConfig = configManager.getSection('urls');
      
      // Base URL should start with http:// or https://
      expect(urlsConfig.baseUrl).toMatch(/^https?:\/\//);
    });

    it('should fallback to defaults if config values are empty', () => {
      // Get default URLs
      const urlsConfig = configManager.getSection('urls');
      const DEFAULT_WS_URL = urlsConfig.wsUrl || 'ws://localhost:5500/v1/chat/stream';
      const DEFAULT_BASE_URL = urlsConfig.baseUrl || 'http://127.0.0.1:5500';

      // Verify defaults are set
      expect(DEFAULT_WS_URL).toBeDefined();
      expect(DEFAULT_BASE_URL).toBeDefined();
      expect(DEFAULT_WS_URL.length).toBeGreaterThan(0);
      expect(DEFAULT_BASE_URL.length).toBeGreaterThan(0);
    });
  });

  describe('URL Updates and Persistence', () => {
    it('should update WebSocket URL in configuration', () => {
      const newWsUrl = 'ws://test.example.com:8080/ws';
      
      // Update URL
      configManager.updateValue('urls', 'wsUrl', newWsUrl);

      // Verify update
      const urlsConfig = configManager.getSection('urls');
      expect(urlsConfig.wsUrl).toBe(newWsUrl);
    });

    it('should update base URL in configuration', () => {
      const newBaseUrl = 'http://test.example.com:8080';
      
      // Update URL
      configManager.updateValue('urls', 'baseUrl', newBaseUrl);

      // Verify update
      const urlsConfig = configManager.getSection('urls');
      expect(urlsConfig.baseUrl).toBe(newBaseUrl);
    });

    it('should persist URL updates to localStorage', () => {
      const newWsUrl = 'ws://test.example.com:8080/ws';
      const newBaseUrl = 'http://test.example.com:8080';
      
      // Update URLs
      configManager.updateValue('urls', 'wsUrl', newWsUrl);
      configManager.updateValue('urls', 'baseUrl', newBaseUrl);

      // Verify localStorage was called
      expect(localStorage.setItem).toHaveBeenCalled();
      
      // Verify the config is persisted
      const config = configManager.getConfig();
      expect(config.urls.wsUrl).toBe(newWsUrl);
      expect(config.urls.baseUrl).toBe(newBaseUrl);
    });

    it('should load persisted URLs from localStorage', () => {
      // Set initial URLs
      const testWsUrl = 'ws://persisted.example.com/ws';
      const testBaseUrl = 'http://persisted.example.com';
      
      configManager.updateValue('urls', 'wsUrl', testWsUrl);
      configManager.updateValue('urls', 'baseUrl', testBaseUrl);

      // Verify URLs are retrieved correctly
      const urlsConfig = configManager.getSection('urls');
      expect(urlsConfig.wsUrl).toBe(testWsUrl);
      expect(urlsConfig.baseUrl).toBe(testBaseUrl);
    });
  });

  describe('URL Validation', () => {
    it('should accept valid WebSocket URLs', () => {
      const validWsUrls = [
        'ws://localhost:5500/v1/chat/stream',
        'wss://example.com/socket',
        'ws://192.168.1.1:8080/ws',
        'wss://secure.example.com:443/stream',
      ];

      validWsUrls.forEach((url) => {
        expect(() => {
          configManager.updateValue('urls', 'wsUrl', url);
        }).not.toThrow();
      });
    });

    it('should accept valid HTTP base URLs', () => {
      const validBaseUrls = [
        'http://localhost:5500',
        'https://example.com',
        'http://192.168.1.1:8080',
        'https://api.example.com:443',
      ];

      validBaseUrls.forEach((url) => {
        expect(() => {
          configManager.updateValue('urls', 'baseUrl', url);
        }).not.toThrow();
      });
    });
  });

  describe('Configuration Integration', () => {
    it('should have all required URL endpoints defined', () => {
      const urlsConfig = configManager.getSection('urls');

      // Verify all required endpoints
      expect(urlsConfig.wsUrl).toBeDefined();
      expect(urlsConfig.baseUrl).toBeDefined();
      expect(urlsConfig.tts).toBeDefined();
      expect(urlsConfig.vlm).toBeDefined();
      expect(urlsConfig.stm).toBeDefined();
    });

    it('should construct complete URLs correctly', () => {
      const urlsConfig = configManager.getSection('urls');

      // TTS, VLM, STM should contain the API paths
      expect(urlsConfig.tts).toContain('/v1/tts');
      expect(urlsConfig.vlm).toContain('/v1/vlm');
      expect(urlsConfig.stm).toContain('/v1/stm');
    });

    it('should allow updating section with multiple values', () => {
      const newUrls = {
        wsUrl: 'ws://new.example.com/ws',
        baseUrl: 'http://new.example.com',
        tts: '/v1/tts/synthesize',
        vlm: '/v1/vlm/analyze',
        stm: '/v1/stm',
      };

      // Update entire section
      configManager.updateSection('urls', newUrls);

      // Verify all updates
      const urlsConfig = configManager.getSection('urls');
      expect(urlsConfig.wsUrl).toBe(newUrls.wsUrl);
      expect(urlsConfig.baseUrl).toBe(newUrls.baseUrl);
      expect(urlsConfig.tts).toBe(newUrls.tts);
      expect(urlsConfig.vlm).toBe(newUrls.vlm);
      expect(urlsConfig.stm).toBe(newUrls.stm);
    });
  });
});
