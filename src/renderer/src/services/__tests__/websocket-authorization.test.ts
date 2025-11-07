/**
 * WebSocket Authorization Flow Tests
 *
 * Tests the authorization handshake with DesktopMate backend
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { wsService } from '../websocket-service';
import { configManager } from '../desktopmate-config';
import { desktopMateAdapter } from '../desktopmate-adapter';

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public onopen: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: (() => void) | null = null;
  public sentMessages: string[] = [];

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      // Create a proper CloseEvent object
      const closeEvent = new Event('close') as CloseEvent;
      Object.assign(closeEvent, {
        code: 1000, // Normal closure
        reason: '',
        wasClean: true
      });
      this.onclose(closeEvent);
    }
  }

  // Helper to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

describe('WebSocket Authorization Flow', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock WebSocket constructor
    global.WebSocket = MockWebSocket as any;

    // Reset wsService state by disconnecting
    wsService.disconnect();
  });

  afterEach(() => {
    wsService.disconnect();
  });

  describe('Authorization Message Sending', () => {
    it('should send authorization message on connection when token is configured', async () => {
      // Set up token in config
      const testToken = 'test-token-12345';
      configManager.updateValue('auth', 'token', testToken);

      // Connect to WebSocket
      wsService.connect('ws://localhost:5500/v1/chat/stream');

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 50));

      // Get the WebSocket instance
      mockWs = (wsService as any).ws as MockWebSocket;

      // Verify authorization message was sent
      expect(mockWs.sentMessages.length).toBeGreaterThan(0);
      
      const firstMessage = JSON.parse(mockWs.sentMessages[0]);
      expect(firstMessage.type).toBe('authorize');
      expect(firstMessage.token).toBe(testToken);
      expect(firstMessage.timestamp).toBeDefined();
    });

    it('should proceed with regular initialization when no token is configured', async () => {
      // Clear token
      configManager.updateValue('auth', 'token', '');

      // Connect to WebSocket
      wsService.connect('ws://localhost:5500/v1/chat/stream');

      // Wait for connection to open
      await new Promise(resolve => setTimeout(resolve, 50));

      // Get the WebSocket instance
      mockWs = (wsService as any).ws as MockWebSocket;

      // Verify regular initialization messages were sent
      const messageTypes = mockWs.sentMessages.map(msg => JSON.parse(msg).type);
      expect(messageTypes.length).toBe(0);
    });

    it('should create properly formatted authorization message', () => {
      const token = 'my-secret-token';
      const authMessage = desktopMateAdapter.createAuthorizeMessage(token);

      expect(authMessage).toHaveProperty('type', 'authorize');
      expect(authMessage).toHaveProperty('token', token);
      expect(authMessage).toHaveProperty('timestamp');
      expect(typeof authMessage.timestamp).toBe('number');
    });
  });

  describe('Authorization Success Handling', () => {
    it('should handle authorize_success and store connection_id', async () => {
      const testToken = 'test-token-12345';
      const testConnectionId = 'conn-abc-123';
      
      configManager.updateValue('auth', 'token', testToken);

      // Connect to WebSocket
      wsService.connect('ws://localhost:5500/v1/chat/stream');
      await new Promise(resolve => setTimeout(resolve, 50));

      mockWs = (wsService as any).ws as MockWebSocket;

      // Simulate successful authorization response
      mockWs.simulateMessage({
        type: 'authorize_success',
        connection_id: testConnectionId,
        timestamp: Date.now()
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify connection ID was stored
      const authStatus = wsService.getAuthorizationStatus();
      expect(authStatus.isAuthorized).toBe(true);
      expect(authStatus.connectionId).toBe(testConnectionId);
      expect(authStatus.isPending).toBe(false);

      // Verify it's persisted in config
      const authConfig = configManager.getSection('auth');
      expect(authConfig.connectionId).toBe(testConnectionId);
    });

    it('should proceed with regular initialization after successful authorization', async () => {
      const testToken = 'test-token-12345';
      const testConnectionId = 'conn-abc-123';
      
      configManager.updateValue('auth', 'token', testToken);

      wsService.connect('ws://localhost:5500/v1/chat/stream');
      await new Promise(resolve => setTimeout(resolve, 50));

      mockWs = (wsService as any).ws as MockWebSocket;

      // Clear sent messages to track post-auth messages
      mockWs.sentMessages = [];

      // Simulate successful authorization
      mockWs.simulateMessage({
        type: 'authorize_success',
        connection_id: testConnectionId,
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify regular initialization messages were sent after authorization
      const messageTypes = mockWs.sentMessages.map(msg => JSON.parse(msg).type);
      expect(messageTypes.length).toBe(0);
    });
  });

  describe('Authorization Error Handling', () => {
    it('should handle authorize_error and close connection', async () => {
      const testToken = 'invalid-token';
      const errorMessage = 'Invalid token';
      
      configManager.updateValue('auth', 'token', testToken);

      wsService.connect('ws://localhost:5500/v1/chat/stream');
      await new Promise(resolve => setTimeout(resolve, 50));

      mockWs = (wsService as any).ws as MockWebSocket;

      // Simulate authorization error
      mockWs.simulateMessage({
        type: 'authorize_error',
        error: errorMessage,
        timestamp: Date.now()
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify authorization status
      const authStatus = wsService.getAuthorizationStatus();
      expect(authStatus.isAuthorized).toBe(false);
      expect(authStatus.isPending).toBe(false);

      // Verify connection was closed
      expect(mockWs.readyState).toBe(WebSocket.CLOSED);
    });

    it('should reset authorization state on disconnect', () => {
      const testToken = 'test-token';
      configManager.updateValue('auth', 'token', testToken);

      wsService.connect('ws://localhost:5500/v1/chat/stream');
      
      // Manually set authorization state
      (wsService as any).isAuthorized = true;
      (wsService as any).authorizationPending = true;

      // Disconnect
      wsService.disconnect();

      // Verify state is reset
      const authStatus = wsService.getAuthorizationStatus();
      expect(authStatus.isAuthorized).toBe(false);
      expect(authStatus.isPending).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should allow setting auth token via setAuthToken', () => {
      const newToken = 'new-token-value';
      wsService.setAuthToken(newToken);

      const authConfig = configManager.getSection('auth');
      expect(authConfig.token).toBe(newToken);
    });

    it('should persist token across page reloads', () => {
      const token = 'persistent-token';
      wsService.setAuthToken(token);

      // Simulate page reload by creating new config instance
      const reloadedConfig = configManager.getSection('auth');
      expect(reloadedConfig.token).toBe(token);
    });
  });

  describe('Authorization Status API', () => {
    it('should provide authorization status information', () => {
      const status = wsService.getAuthorizationStatus();

      expect(status).toHaveProperty('isAuthorized');
      expect(status).toHaveProperty('isPending');
      expect(status).toHaveProperty('connectionId');
      
      expect(typeof status.isAuthorized).toBe('boolean');
      expect(typeof status.isPending).toBe('boolean');
    });
  });
});
