/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-use-before-define */
import { Subject } from 'rxjs';
import { ModelInfo } from '@/context/live2d-config-context';
import { HistoryInfo } from '@/context/websocket-context';
import { ConfigFile } from '@/context/character-config-context';
import { toaster } from '@/components/ui/toaster';
import { desktopMateAdapter } from './desktopmate-adapter';
import { configManager } from './desktopmate-config';

export interface DisplayText {
  text: string;
  name: string;
  avatar: string;
}

interface BackgroundFile {
  name: string;
  url: string;
}

export interface AudioPayload {
  type: 'audio';
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  display_text?: DisplayText;
  actions?: Actions;
}

export interface Message {
  id: string;
  content: string;
  role: "ai" | "human";
  timestamp: string;
  name?: string;
  avatar?: string;

  // Fields for different message types (make optional)
  type?: 'text' | 'tool_call_status'; // Add possible types, default to 'text' if omitted
  tool_id?: string; // Specific to tool calls
  tool_name?: string; // Specific to tool calls
  status?: 'running' | 'completed' | 'error'; // Specific to tool calls
}

export interface Actions {
  expressions?: string[] | number [];
  pictures?: string[];
  sounds?: string[];
}

export interface MessageEvent {
  tool_id: any;
  tool_name: any;
  name: any;
  status: any;
  content: string;
  timestamp: string;
  type: string;
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  files?: BackgroundFile[];
  actions?: Actions;
  text?: string;
  model_info?: ModelInfo;
  conf_name?: string;
  conf_uid?: string;
  uids?: string[];
  messages?: Message[];
  history_uid?: string;
  success?: boolean;
  histories?: HistoryInfo[];
  configs?: ConfigFile[];
  message?: string;
  members?: string[];
  is_owner?: boolean;
  client_uid?: string;
  forwarded?: boolean;
  display_text?: DisplayText;
  live2d_model?: string;
  chunk?: string; // TTS audio chunk (base64)
  emotion?: string; // Emotion/expression for TTS chunk
  turn_id?: string; // Turn ID for TTS chunk
  browser_view?: {
    debuggerFullscreenUrl: string;
    debuggerUrl: string;
    pages: {
      id: string;
      url: string;
      faviconUrl: string;
      title: string;
      debuggerUrl: string;
      debuggerFullscreenUrl: string;
    }[];
    wsUrl: string;
    sessionId?: string;
  };
}

// Get translation function for error messages
const getTranslation = () => {
  try {
    const i18next = require('i18next').default;
    return i18next.t.bind(i18next);
  } catch (e) {
    // Fallback if i18next is not available
    return (key: string) => key;
  }
};

class WebSocketService {
  private static instance: WebSocketService;

  private ws: WebSocket | null = null;

  private messageSubject = new Subject<MessageEvent>();

  private stateSubject = new Subject<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>();

  private currentState: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' = 'CLOSED';

  private isAuthorized = false;

  private authorizationPending = false;

  // Reconnection properties
  private reconnectAttempts = 0;

  private maxReconnectAttempts = 5;

  private baseReconnectDelay = 3000; // 3 seconds

  private reconnectTimer: NodeJS.Timeout | null = null;

  private currentUrl = '';

  private isReconnecting = false;

  private shouldReconnect = true;

  // Message queue for offline messages
  private messageQueue: object[] = [];

  private maxQueueSize = 100;

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private initializeConnection() {
    // Send authorization message first if token is available
    const authConfig = configManager.getSection('auth');
    if (authConfig.token) {
      this.sendAuthorizationMessage(authConfig.token);
    } else {
      // If no token, proceed with regular initialization
      this.proceedWithRegularInitialization();
    }
  }

  private sendAuthorizationMessage(token: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send authorization: WebSocket not open');
      return;
    }

    this.authorizationPending = true;
    const authMessage = desktopMateAdapter.createAuthorizeMessage(token);
    console.log('Sending authorization message');
    this.ws.send(JSON.stringify(authMessage));
  }

  private proceedWithRegularInitialization() {
    this.sendMessage({
      type: 'fetch-backgrounds',
    });
    this.sendMessage({
      type: 'fetch-configs',
    });
    this.sendMessage({
      type: 'fetch-history-list',
    });
    this.sendMessage({
      type: 'create-new-history',
    });
  }

  private handleAuthorizationSuccess(connectionId: string) {
    console.log('Authorization successful, connection ID:', connectionId);
    this.isAuthorized = true;
    this.authorizationPending = false;

    // Store connection ID in config
    configManager.updateValue('auth', 'connectionId', connectionId);

    // Proceed with regular initialization after successful authorization
    this.proceedWithRegularInitialization();

    toaster.create({
      title: getTranslation()('success.authorized'),
      type: 'success',
      duration: 2000,
    });
  }

  private handleAuthorizationError(error: string) {
    console.error('Authorization failed:', error);
    this.isAuthorized = false;
    this.authorizationPending = false;

    toaster.create({
      title: `${getTranslation()('error.authorizationFailed')}: ${error}`,
      type: 'error',
      duration: 5000,
    });

    // Close connection on authorization failure
    this.disconnect();
  }

  private handlePingMessage(pingReceived: number) {
    // Create pong message using adapter
    const pongMessage = desktopMateAdapter.createPongMessage();
    
    // Send pong response immediately
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(pongMessage));
      
      const pongSent = performance.now();
      const responseTime = pongSent - pingReceived;
      
      // Log heartbeat event for debugging
      console.debug(`Heartbeat: Ping received, Pong sent in ${responseTime.toFixed(2)}ms`);
      
      // Warn if response time exceeds 100ms threshold
      if (responseTime > 100) {
        console.warn(`Heartbeat response time exceeded 100ms: ${responseTime.toFixed(2)}ms`);
      }
    } else {
      console.error('Cannot send pong: WebSocket not open');
    }
  }

  /**
   * Calculate exponential backoff delay with jitter
   * Formula: baseDelay * (2 ^ attempt) + random jitter
   */
  private getReconnectDelay(): number {
    const exponentialDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    const maxDelay = 60000; // Cap at 60 seconds
    const delay = Math.min(exponentialDelay, maxDelay);
    
    // Add random jitter (0-25% of delay) to prevent thundering herd
    const jitter = Math.random() * delay * 0.25;
    return delay + jitter;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private scheduleReconnect() {
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Don't reconnect if we've exceeded max attempts or reconnection is disabled
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
        toaster.create({
          title: getTranslation()('error.maxReconnectAttemptsReached'),
          type: 'error',
          duration: 5000,
        });
      }
      this.isReconnecting = false;
      return;
    }

    const delay = this.getReconnectDelay();
    console.log(`Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
    
    toaster.create({
      title: `${getTranslation()('info.reconnecting')} (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
      type: 'info',
      duration: 3000,
    });

    this.isReconnecting = true;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.currentUrl);
    }, delay);
  }

  /**
   * Handle connection close event
   */
  private handleClose(event: CloseEvent) {
    console.log('WebSocket closed:', event.code, event.reason);
    this.currentState = 'CLOSED';
    this.stateSubject.next('CLOSED');
    this.isAuthorized = false;
    this.authorizationPending = false;
    this.ws = null;

    // Only attempt reconnection if it wasn't a clean close and reconnection is enabled
    if (event.code !== 1000 && this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection error event
   */
  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.isAuthorized = false;
    this.authorizationPending = false;

    const shouldAttemptReconnect = this.shouldReconnect && !this.isReconnecting;

    if (shouldAttemptReconnect) {
      this.scheduleReconnect();
    }

    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      try {
        this.ws.close();
      } catch (closeError) {
        console.error('Failed to close WebSocket after error:', closeError);
      }
    }
    
    toaster.create({
      title: getTranslation()('error.websocketConnectionError'),
      type: 'error',
      duration: 3000,
    });
  }

  /**
   * Flush queued messages after successful connection
   */
  private flushMessageQueue() {
    if (this.messageQueue.length === 0) {
      return;
    }

    console.log(`Flushing ${this.messageQueue.length} queued messages...`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = []; // Clear queue before sending

    // Send messages directly to avoid re-queuing
    messages.forEach((message) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    });

    toaster.create({
      title: getTranslation()('success.queuedMessagesSent'),
      type: 'success',
      duration: 2000,
    });
  }

  connect(url: string) {
    // Store URL for reconnection
    this.currentUrl = url;

    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING ||
        this.ws?.readyState === WebSocket.OPEN) {
      // Close existing connection without disabling reconnection
      this.closeConnection();
    }

    try {
      this.ws = new WebSocket(url);
      this.currentState = 'CONNECTING';
      this.stateSubject.next('CONNECTING');

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.currentState = 'OPEN';
        this.stateSubject.next('OPEN');
        
        // Check if this was a reconnection before resetting
        const wasReconnecting = this.reconnectAttempts > 0;
        
        // Reset reconnection state on successful connection
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        
        // Initialize connection
        this.initializeConnection();
        
        // Flush any queued messages
        this.flushMessageQueue();

        // Notify user of successful reconnection
        if (wasReconnecting) {
          toaster.create({
            title: getTranslation()('success.reconnected'),
            type: 'success',
            duration: 2000,
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const pingReceived = performance.now();
          const message = JSON.parse(event.data);
          
          // Handle authorization messages separately
          if (message.type === 'authorize_success') {
            this.handleAuthorizationSuccess(message.connection_id);
            return;
          }
          
          if (message.type === 'authorize_error') {
            this.handleAuthorizationError(message.error || 'Unknown authorization error');
            return;
          }

          // Handle ping messages - respond with pong immediately
          if (message.type === 'ping') {
            this.handlePingMessage(pingReceived);
            return;
          }

          // Forward other messages to subscribers
          this.messageSubject.next(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          toaster.create({
            title: `${getTranslation()('error.failedParseWebSocket')}: ${error}`,
            type: "error",
            duration: 2000,
          });
        }
      };

      this.ws.onclose = (event) => {
        this.handleClose(event);
      };

      this.ws.onerror = (error) => {
        this.handleError(error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.currentState = 'CLOSED';
      this.stateSubject.next('CLOSED');
      
      // Attempt reconnection on connection failure
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  sendMessage(message: object) {
    const socket = this.ws;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return;
    } else {
      console.warn('WebSocket is not open. Queueing message:', message);
      
      // Queue message if we're reconnecting or will reconnect
      if (this.isReconnecting || this.reconnectAttempts < this.maxReconnectAttempts) {
        if (this.messageQueue.length < this.maxQueueSize) {
          this.messageQueue.push(message);
          console.log(`Message queued. Queue size: ${this.messageQueue.length}`);
        } else {
          console.warn('Message queue is full. Dropping oldest message.');
          this.messageQueue.shift(); // Remove oldest message
          this.messageQueue.push(message);
        }
      } else {
        // Not reconnecting, show error
        toaster.create({
          title: getTranslation()('error.websocketNotOpen'),
          type: 'error',
          duration: 2000,
        });
      }
    }
  }

  onMessage(callback: (message: MessageEvent) => void) {
    return this.messageSubject.subscribe(callback);
  }

  onStateChange(callback: (state: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED') => void) {
    return this.stateSubject.subscribe(callback);
  }

  /**
   * Close the WebSocket connection without disabling reconnection
   * Used internally when switching connections
   */
  private closeConnection() {
    if (this.currentState !== 'CLOSED') {
      this.currentState = 'CLOSING';
      this.stateSubject.next('CLOSING');
    }
    this.ws?.close();
    this.ws = null;
    this.isAuthorized = false;
    this.authorizationPending = false;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  disconnect() {
    // Disable reconnection when manually disconnecting
    this.shouldReconnect = false;
    
    // Clear any reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.closeConnection();
  }

  /**
   * Enable automatic reconnection
   */
  enableReconnection() {
    this.shouldReconnect = true;
  }

  /**
   * Disable automatic reconnection
   */
  disableReconnection() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Get reconnection status
   */
  getReconnectionStatus() {
    return {
      isReconnecting: this.isReconnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      queuedMessages: this.messageQueue.length,
    };
  }

  getCurrentState() {
    return this.currentState;
  }

  getAuthorizationStatus() {
    return {
      isAuthorized: this.isAuthorized,
      isPending: this.authorizationPending,
      connectionId: configManager.getSection('auth').connectionId,
    };
  }

  setAuthToken(token: string) {
    configManager.updateValue('auth', 'token', token);
  }
}

export const wsService = WebSocketService.getInstance();
