/**
 * API Integration Tests
 * 
 * Tests all backend API endpoints to ensure frontend types match actual API
 * Backend should be running at http://localhost:5500
 */

import { describe, it, expect, beforeAll, assert } from 'vitest';
import { desktopMateAdapter } from '../desktopmate-adapter';
import { configManager } from '../desktopmate-config';
import type {
  AddChatHistoryRequest,
  GetChatHistoryRequest,
  ListSessionsRequest,
  DeleteSessionRequest,
  STMMessage,
} from '../config-types';

const BASE_URL = 'http://localhost:5500';
const TEST_USER_ID = 'test-user-001';
const TEST_AGENT_ID = 'test-agent-001';

// Test data
const TEST_TTS_TEXT = 'Hello, this is a test of the text-to-speech system.';
const TEST_IMAGE_URL = 'https://external-preview.redd.it/shiki-natsume-v0-wBgSzBHXBZrzjI8f0mIQ_40-pe6069ikT9xnoNn2liA.jpg?auto=webp&s=3fdbd0ceb69cab6c2efc6dd68559ca7fa8a7d191'; // Sample image URL for VLM testing
const TEST_VLM_PROMPT = 'Describe this image';

describe('API Integration Tests', () => {
  beforeAll(() => {
    // Ensure config points to the correct backend
    configManager.updateSection('urls', {
      wsUrl: 'ws://127.0.0.1:5500/v1/chat/stream',
      baseUrl: BASE_URL,
      tts: `${BASE_URL}/v1/tts/synthesize`,
      vlm: `${BASE_URL}/v1/vlm/analyze`,
      stm: `${BASE_URL}/v1/stm`,
    });
  });

  describe('TTS API', () => {
    it('should synthesize speech successfully', async () => {
      const response = await desktopMateAdapter.synthesizeSpeech(TEST_TTS_TEXT);

      // Python-like assert style
      assert.isDefined(response);
      assert.isDefined(response.audio_data);
      assert.isString(response.audio_data);
      assert.isAbove(response.audio_data.length, 0);
      assert.isDefined(response.format);
      assert.include(['base64', 'bytes'], response.format);
    }, 30000); // 30s timeout for TTS

    it('should synthesize speech with custom reference_id', async () => {
      const response = await desktopMateAdapter.synthesizeSpeech(
        TEST_TTS_TEXT,
        'custom-voice-ref'
      );

      // Mix of both styles - you can use either!
      assert.isDefined(response);
      assert.isDefined(response.audio_data);
      assert.isAbove(response.audio_data.length, 0);
    }, 30000);

    it('should handle empty text error', async () => {
      // Expected error - suppress error logs for cleaner test output
      const originalConsoleError = console.error;
      console.error = () => {}; // Suppress error logs
      
      await expect(desktopMateAdapter.synthesizeSpeech('')).rejects.toThrow();
      
      console.error = originalConsoleError; // Restore
    });
  });

  describe('VLM API', () => {
    it('should analyze image successfully', async () => {
      const response = await desktopMateAdapter.analyzeImage(
        TEST_IMAGE_URL,
        TEST_VLM_PROMPT
      );

      assert.isDefined(response);
      assert.isDefined(response.description);
      assert.isString(response.description);
      assert.isAbove(response.description.length, 0);
    }, 30000); // 30s timeout for VLM

    it('should analyze image without explicit prompt', async () => {
      const response = await desktopMateAdapter.analyzeImage(TEST_IMAGE_URL);

      assert.isDefined(response);
      assert.isDefined(response.description);
      assert.isAbove(response.description.length, 0);
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
        // Expected error - suppress error logs for cleaner test output
        const originalConsoleError = console.error;
        console.error = () => {}; // Suppress error logs
        
        const request: DeleteSessionRequest = {
          session_id: 'non-existent-session-id',
          user_id: TEST_USER_ID,
          agent_id: TEST_AGENT_ID,
        };

        await expect(desktopMateAdapter.deleteSession(request)).rejects.toThrow();
        
        console.error = originalConsoleError; // Restore
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
});
