/**
 * End-to-End API Integration Tests
 * 
 * Comprehensive tests for all backend API endpoints using REAL API calls (no mocks)
 * Tests TTS, VLM, STM (Short-Term Memory), and WebSocket functionality
 * 
 * Prerequisites:
 * - Backend server must be running at http://localhost:5500
 * - All services (TTS, VLM, STM, WebSocket) must be available
 * 
 * This test suite validates:
 * 1. TTS API - Speech synthesis and audio processing
 * 2. VLM API - Vision-Language Model image analysis
 * 3. STM API - Session and chat history CRUD operations
 * 4. WebSocket - Real-time message streaming and protocol compliance
 */

import { describe, it, expect, beforeAll, afterAll, assert } from 'vitest';
import { desktopMateAdapter } from '../desktopmate-adapter';
import { configManager } from '../desktopmate-config';
import { wsService } from '../websocket-service';
import type {
  AddChatHistoryRequest,
  GetChatHistoryRequest,
  ListSessionsRequest,
  DeleteSessionRequest,
  STMMessage,
} from '../config-types';

const BASE_URL = 'http://localhost:5500';
const WS_URL = 'ws://127.0.0.1:5500/v1/chat/stream';
const TEST_USER_ID = 'e2e-test-user-001';
const TEST_AGENT_ID = 'e2e-test-agent-001';

// Test data
const TEST_TTS_TEXT = 'Hello, this is a comprehensive end-to-end test of the text-to-speech system.';
const TEST_TTS_SHORT = 'Test';
const TEST_IMAGE_URL = 'https://external-preview.redd.it/shiki-natsume-v0-wBgSzBHXBZrzjI8f0mIQ_40-pe6069ikT9xnoNn2liA.jpg?auto=webp&s=3fdbd0ceb69cab6c2efc6dd68559ca7fa8a7d191';
const TEST_VLM_PROMPT = 'Describe this anime character in detail';

// Track test session IDs for cleanup
const testSessionIds: string[] = [];

// Try to load a Node WebSocket client (optional). If not installed, WebSocket tests will be skipped.
let WsClient: any = null;
try {
  // prefer 'ws' if available
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  WsClient = require('ws');
} catch (e) {
  // ws not installed; WebSocket tests will be skipped with a clear message
  WsClient = null;
}
describe('API Integration Tests', () => {
  beforeAll(() => {
    // Ensure config points to the correct backend
    configManager.updateSection('urls', {
      wsUrl: WS_URL,
      baseUrl: BASE_URL,
      tts: `${BASE_URL}/v1/tts/synthesize`,
      vlm: `${BASE_URL}/v1/vlm/analyze`,
      stm: `${BASE_URL}/v1/stm`,
    });

    if (E2E_WS_TOKEN) {
      configManager.updateValue('auth', 'token', E2E_WS_TOKEN);
    }
  });

  afterAll(async () => {
    // Clean up test sessions
    for (const sessionId of testSessionIds) {
      try {
        await desktopMateAdapter.deleteSession({
          session_id: sessionId,
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
        });
      } catch (error) {
        // Ignore cleanup errors
        console.warn(`Failed to cleanup session ${sessionId}:`, error);
      }
    }

    // Ensure WebSocket service is reset for subsequent test runs
    wsService.disconnect();
    wsService.enableReconnection();
  });

  describe('TTS API - Text-to-Speech Synthesis', () => {
    it('should synthesize speech successfully with default voice', async () => {
      const response = await desktopMateAdapter.synthesizeSpeech(TEST_TTS_TEXT);

      // Validate response structure
      assert.isDefined(response, 'TTS response should be defined');
      assert.isDefined(response.audio_data, 'audio_data field is required');
      assert.isString(response.audio_data, 'audio_data should be a string');
      assert.isAbove(response.audio_data.length, 0, 'audio_data should not be empty');
      
      assert.isDefined(response.format, 'format field is required');
      assert.include(['base64', 'bytes'], response.format, 'format should be base64 or bytes');
      
      // Validate base64 encoding if format is base64
      if (response.format === 'base64') {
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        assert.match(response.audio_data, base64Regex, 'audio_data should be valid base64');
      }
    }, 30000);

    it('should synthesize speech with custom reference voice ID', async () => {
      const customVoiceId = 'custom-voice-ref-001';
      const response = await desktopMateAdapter.synthesizeSpeech(
        TEST_TTS_TEXT,
        customVoiceId
      );

      assert.isDefined(response, 'TTS response with custom voice should be defined');
      assert.isDefined(response.audio_data, 'audio_data should exist');
      assert.isAbove(response.audio_data.length, 0, 'audio should be generated');
    }, 30000);

    it('should synthesize short text correctly', async () => {
      const response = await desktopMateAdapter.synthesizeSpeech(TEST_TTS_SHORT);

      assert.isDefined(response);
      assert.isDefined(response.audio_data);
      assert.isAbove(response.audio_data.length, 0);
    }, 30000);

    it('should reject empty text input', async () => {
      await expect(
        desktopMateAdapter.synthesizeSpeech('')
      ).rejects.toThrow(/text/i);
    });

    it('should reject whitespace-only text', async () => {
      await expect(
        desktopMateAdapter.synthesizeSpeech('   ')
      ).rejects.toThrow(/text/i);
    });

    it('should extract volumes from synthesized audio', async () => {
      const ttsResponse = await desktopMateAdapter.synthesizeSpeech(TEST_TTS_SHORT);
      const volumes = desktopMateAdapter.extractVolumes(ttsResponse.audio_data);

      assert.isDefined(volumes, 'Volumes should be extracted');
      assert.isArray(volumes, 'Volumes should be an array');
      assert.isAbove(volumes.length, 0, 'Should have volume data points');

      // Validate volume range (0-1)
      volumes.forEach((volume, index) => {
        assert.isAtLeast(volume, 0, `Volume at index ${index} should be >= 0`);
        assert.isAtMost(volume, 1, `Volume at index ${index} should be <= 1`);
        assert.isNumber(volume, `Volume at index ${index} should be a number`);
      });
    }, 30000);
  });

  describe('VLM API - Vision-Language Model', () => {
    it('should analyze image with explicit prompt', async () => {
      const response = await desktopMateAdapter.analyzeImage(
        TEST_IMAGE_URL,
        TEST_VLM_PROMPT
      );

      assert.isDefined(response, 'VLM response should be defined');
      assert.isDefined(response.description, 'description field is required');
      assert.isString(response.description, 'description should be a string');
      assert.isAbove(response.description.length, 10, 'description should be meaningful');
      
      // Description should contain relevant content
      console.log('VLM Analysis:', response.description);
    }, 30000);

    it('should analyze image without explicit prompt (auto-describe)', async () => {
      const response = await desktopMateAdapter.analyzeImage(TEST_IMAGE_URL);

      assert.isDefined(response, 'Auto-describe response should be defined');
      assert.isDefined(response.description, 'description should be generated');
      assert.isAbove(response.description.length, 10, 'auto-description should be meaningful');
    }, 30000);

    it('should reject empty image URL', async () => {
      await expect(
        desktopMateAdapter.analyzeImage('')
      ).rejects.toThrow();
    });

    it('should reject invalid image URL', async () => {
      await expect(
        desktopMateAdapter.analyzeImage('not-a-valid-url')
      ).rejects.toThrow();
    }, 30000);
  });

  describe('STM API', () => {
    let testSessionId: string;

    describe('Add Chat History', () => {
      it('should create a new session and add messages', async () => {
        const messages: STMMessage[] = [
          { type: 'human' as const, content: 'Hello, how are you?' },
          { type: 'ai' as const, content: 'I am doing well, thank you for asking!' },
        ];

        const request: AddChatHistoryRequest = {
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
          messages,
        };

        const response = await desktopMateAdapter.addChatHistory(request);

        assert.isDefined(response);
        assert.isDefined(response.session_id);
        assert.isString(response.session_id);
        assert.equal(response.message_count, 2);

        // Save session ID for subsequent tests
        testSessionId = response.session_id;
      });

      it('should add messages to existing session', async () => {
        const messages: STMMessage[] = [
          { type: 'human' as const, content: 'What is the weather like?' },
          { type: 'ai' as const, content: 'I don\'t have access to current weather data.' },
        ];

        const request: AddChatHistoryRequest = {
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
          session_id: testSessionId,
          messages,
        };

        const response = await desktopMateAdapter.addChatHistory(request);

        assert.isDefined(response);
        assert.equal(response.session_id, testSessionId);
        assert.equal(response.message_count, 2);
      });
    });

    describe('Get Chat History', () => {
      it('should retrieve chat history from session', async () => {
        const request: GetChatHistoryRequest = {
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
          session_id: testSessionId,
        };

        const response = await desktopMateAdapter.getChatHistory(request);

        assert.isDefined(response);
        assert.equal(response.session_id, testSessionId);
        assert.isDefined(response.messages);
        assert.isArray(response.messages);
        assert.isAbove(response.messages.length, 0);

        // Check message structure
        const firstMessage = response.messages[0];
        assert.isDefined(firstMessage.type);
        assert.include(['human', 'ai', 'system'], firstMessage.type);
        assert.isDefined(firstMessage.content);
        assert.isString(firstMessage.content);
      });

      it('should retrieve limited chat history', async () => {
        const request: GetChatHistoryRequest = {
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
          session_id: testSessionId,
          limit: 2,
        };

        const response = await desktopMateAdapter.getChatHistory(request);

        assert.isDefined(response);
        assert.isAtMost(response.messages.length, 2);
      });
    });

    describe('List Sessions', () => {
      it('should list all sessions for user and agent', async () => {
        const request: ListSessionsRequest = {
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
        };

        const response = await desktopMateAdapter.listSessions(request);

        assert.isDefined(response);
        assert.isDefined(response.sessions);
        assert.isArray(response.sessions);
        assert.isAbove(response.sessions.length, 0);

        // Check session structure
        const session = response.sessions.find(s => s.session_id === testSessionId);
        assert.isDefined(session);
        assert.equal(session!.user_id, TEST_USER_ID);
        assert.equal(session!.agent_id, TEST_AGENT_ID);
        assert.isDefined(session!.created_at);
        assert.isDefined(session!.updated_at);
        assert.isDefined(session!.metadata);
      });
    });

    describe('Update Session Metadata', () => {
      it('should update session metadata', async () => {
        const metadata = {
          test_key: 'test_value',
          updated_at: new Date().toISOString(),
          custom_data: { foo: 'bar' },
        };

        const response = await desktopMateAdapter.updateSessionMetadata(
          testSessionId,
          { metadata }
        );

        assert.isDefined(response);
        assert.isTrue(response.success);
        assert.isDefined(response.message);
      });
    });

    describe('Delete Session', () => {
      it('should delete a session', async () => {
        const request: DeleteSessionRequest = {
          session_id: testSessionId,
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
        };

        const response = await desktopMateAdapter.deleteSession(request);

        assert.isDefined(response);
        assert.isTrue(response.success);
        assert.isDefined(response.message);
      });

      it('should return error for non-existent session', async () => {
        const request: DeleteSessionRequest = {
          session_id: 'non-existent-session-id',
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
        };

        await expect(desktopMateAdapter.deleteSession(request)).rejects.toThrow();
      });
    });
  });

  describe('Audio Processing', () => {
    it('should extract volumes from WAV audio', async () => {
      // First get some audio from TTS
      const ttsResponse = await desktopMateAdapter.synthesizeSpeech('Test');
      
      // Extract volumes from the audio
      const volumes = desktopMateAdapter.extractVolumes(ttsResponse.audio_data);

      assert.isDefined(volumes);
      assert.isArray(volumes);
      assert.isAbove(volumes.length, 0);

      // Check that all volumes are in 0-1 range
      volumes.forEach(volume => {
        assert.isAtLeast(volume, 0);
        assert.isAtMost(volume, 1);
      });
    }, 30000);
  });

  // WebSocket E2E tests (optional - requires 'ws' package to be installed in the project)
  const E2E_WS_TOKEN = process.env.E2E_WS_TOKEN || configManager.getSection('auth')?.token || '';
  if (WsClient && E2E_WS_TOKEN) {
    const waitForWebSocketState = (
      targetState: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED',
      occurrences = 1,
      timeoutMs = 15000,
    ) => {
      return new Promise<void>((resolve, reject) => {
        let seen = 0;
        let subscription: ReturnType<typeof wsService.onStateChange> | null = null;

        const timer = setTimeout(() => {
          subscription?.unsubscribe();
          reject(new Error(`Timed out waiting for WebSocket state ${targetState}`));
        }, timeoutMs);

        subscription = wsService.onStateChange((state) => {
          if (state === targetState) {
            seen += 1;
            if (seen >= occurrences) {
              clearTimeout(timer);
              subscription?.unsubscribe();
              resolve();
            }
          }
        });
      });
    };

    describe('WebSocket E2E', () => {
      it('should connect, authorize and receive authorize_success', async () => {
        await new Promise<void>((resolve, reject) => {
          const ws = new WsClient(WS_URL);
          const timer = setTimeout(() => {
            ws.terminate();
            reject(new Error('WebSocket authorize timeout'));
          }, 15000);

          ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'authorize', token: E2E_WS_TOKEN }));
          });

          ws.on('message', (data: any) => {
            try {
              const parsed = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
              if (parsed?.type === 'authorize_success') {
                clearTimeout(timer);
                assert.isDefined(parsed.connection_id);
                ws.close();
                resolve();
              }

              if (parsed?.type === 'authorize_error') {
                clearTimeout(timer);
                ws.close();
                reject(new Error('Authorization failed: ' + JSON.stringify(parsed)));
              }
            } catch (err) {
              clearTimeout(timer);
              ws.close();
              reject(err as Error);
            }
          });

          ws.on('error', (err: Error) => {
            clearTimeout(timer);
            reject(err);
          });
        });
      }, 20000);

      it('should respond to ping with pong (roundtrip)', async () => {
        await new Promise<void>((resolve, reject) => {
          const ws = new WsClient(WS_URL);
          const timer = setTimeout(() => {
            ws.terminate();
            reject(new Error('WebSocket ping timeout'));
          }, 15000);

          ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'authorize', token: E2E_WS_TOKEN }));
          });

          ws.on('message', (data: any) => {
            try {
              const parsed = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
              // On successful authorize, proactively send a ping and also be ready to reply if server pings us
              if (parsed?.type === 'authorize_success') {
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
                return;
              }

              // If server replies with pong to our ping, test passes
              if (parsed?.type === 'pong') {
                clearTimeout(timer);
                ws.close();
                resolve();
                return;
              }

              // If server initiates a ping, reply with pong and consider roundtrip successful
              if (parsed?.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                clearTimeout(timer);
                ws.close();
                resolve();
                return;
              }
            } catch (err) {
              clearTimeout(timer);
              ws.close();
              reject(err as Error);
            }
          });

          ws.on('error', (err: Error) => {
            clearTimeout(timer);
            reject(err);
          });
        });
      }, 20000);

      it('should automatically reconnect after unexpected disconnection', async () => {
        // Adapt Node ws client to browser-compatible interface for the service
        class NodeWebSocketAdapter {
          static readonly CONNECTING = 0;
          static readonly OPEN = 1;
          static readonly CLOSING = 2;
          static readonly CLOSED = 3;

          public readyState = NodeWebSocketAdapter.CONNECTING;
          public onopen: ((event: Event) => void) | null = null;
          public onclose: ((event: CloseEvent) => void) | null = null;
          public onerror: ((event: Event) => void) | null = null;
          public onmessage: ((event: MessageEvent) => void) | null = null;

          private socket: InstanceType<typeof WsClient>;

          constructor(url: string) {
            this.socket = new WsClient(url);

            this.socket.on('open', () => {
              this.readyState = NodeWebSocketAdapter.OPEN;
              this.onopen?.(new Event('open'));
            });

            this.socket.on('message', (data: any) => {
              const payload = typeof data === 'string' ? data : data?.toString?.() ?? '';
              this.onmessage?.(new MessageEvent('message', { data: payload }));
            });

            this.socket.on('error', (error: Error) => {
              const event = new Event('error');
              (event as any).error = error;
              this.readyState = NodeWebSocketAdapter.CLOSING;
              this.onerror?.(event);
            });

            this.socket.on('close', (code: number, reason: Buffer) => {
              this.readyState = NodeWebSocketAdapter.CLOSED;
              const reasonText = typeof reason === 'string' ? reason : reason?.toString?.() ?? '';
              this.onclose?.(new CloseEvent('close', { code, reason: reasonText }));
            });
          }

          send(data: string) {
            this.socket.send(data);
          }

          close(code?: number, reason?: string) {
            this.readyState = NodeWebSocketAdapter.CLOSING;
            this.socket.close(code, reason);
          }

          terminate() {
            if (typeof (this.socket as any).terminate === 'function') {
              (this.socket as any).terminate();
            } else {
              this.socket.close();
            }
          }
        }

        const originalWebSocket = (globalThis as any).WebSocket;
        const originalRandom = Math.random;

        Math.random = () => 0; // Remove jitter for deterministic delay
        (globalThis as any).WebSocket = NodeWebSocketAdapter as unknown as typeof WebSocket;

        // Ensure clean starting state
        wsService.disconnect();
        wsService.enableReconnection();
        configManager.updateValue('auth', 'token', E2E_WS_TOKEN);

        try {
          wsService.connect(WS_URL);

          await waitForWebSocketState('OPEN', 1, 15000);

          const initialSocket = (wsService as any).ws;
          assert.isDefined(initialSocket, 'WebSocket should be available after initial connection');

          const closedPromise = waitForWebSocketState('CLOSED', 1, 15000);
          const reopenedPromise = waitForWebSocketState('OPEN', 1, 20000);

          (wsService as any).ws?.close(4001, 'forced disconnect');

          await closedPromise;
          await reopenedPromise;

          const reconnectedSocket = (wsService as any).ws;
          assert.isDefined(reconnectedSocket, 'WebSocket should be available after reconnection');
          assert.notEqual(reconnectedSocket, initialSocket, 'WebSocket instance should be replaced after reconnection');

          const status = wsService.getReconnectionStatus();
          assert.equal(status.reconnectAttempts, 0, 'Reconnect attempts should reset after successful reconnection');
          assert.isFalse(status.isReconnecting, 'Service should not be marked as reconnecting after success');
        } finally {
          wsService.disconnect();
          wsService.enableReconnection();
          (globalThis as any).WebSocket = originalWebSocket;
          Math.random = originalRandom;
        }
      }, 40000);
    });
  } else {
    // Inform the user that ws is not installed and WebSocket E2E tests are skipped
    // eslint-disable-next-line no-console
    console.warn("Skipping WebSocket E2E tests: 'ws' package is not installed. Run 'npm i -D ws' to enable.");
  }
});
