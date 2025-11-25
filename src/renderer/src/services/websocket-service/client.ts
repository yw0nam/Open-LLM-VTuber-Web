// src/renderer/src/services/websocket-service/client.ts
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-use-before-define */
import { Subject } from "rxjs";
import {
  WSAuthorizeMessageSchema,
  WSChatMessageSchema,
  type WSChatMessage,
  WSInterruptStreamMessageSchema,
  type WSInterruptStreamMessage,
  WSPongMessageSchema,
  WSServerMessage,
  WSServerMessageSchema,

} from "@/services/schemas/websocket";
import { toaster } from "@/components/ui/toaster";

export type WebSocketConnectionState =
  | "IDLE"
  | "CONNECTING"
  | "OPEN"
  | "AUTHORIZING"
  | "READY"
  | "CLOSING"
  | "CLOSED"
  | "ERROR";

type QueuedMessage = {
  payload: Record<string, unknown>;
  requireAuth: boolean;
};

// Get translation function for error messages
const getTranslation = () => {
  try {
    const i18next = require("i18next").default;
    return i18next.t.bind(i18next);
  } catch (e) {
    // Fallback if i18next is not available
    return (key: string) => key;
  }
};

class WebSocketService {
  private initializeConnection() {
    console.log("[wsService] Initializing connection - sending fetch requests");
    this.sendMessage(
      {
        type: 'fetch_backgrounds',
      },
      { requireAuth: false }
    );
    this.sendMessage(
      {
        type: 'fetch_avatar_configs',
      },
      { requireAuth: false }
    );
  }
  private static instance: WebSocketService;

  private ws: WebSocket | null = null;

  private url?: string;

  private authToken: string | null = null;

  private reconnectAttempts = 0;

  private shouldReconnect = true;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  private lastServerMessageAt = 0;

  private readonly heartbeatTimeoutMs = 45_000;

  private readonly reconnectBackoffMs = 2_000;

  private readonly maxReconnectAttempts = 5;

  private isAuthorized = false;

  private connectionId: string | null = null;

  private queuedMessages: QueuedMessage[] = [];

  private manualClose = false;

  private messageSubject = new Subject<WSServerMessage>();

  private stateSubject = new Subject<WebSocketConnectionState>();

  private currentState: WebSocketConnectionState = "CLOSED";

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  getConnectionId() {
    return this.connectionId;
  }

  connect(url: string, options?: { token?: string; autoReconnect?: boolean }) {
    if (options?.token) {
      this.authToken = options.token;
    }

    this.url = url;
    this.shouldReconnect = options?.autoReconnect ?? true;

    if (
      this.ws?.readyState === WebSocket.CONNECTING ||
      this.ws?.readyState === WebSocket.OPEN
    ) {
      this.disconnect({ suppressReconnect: true });
    }

    try {
      this.ws = new WebSocket(url);
      this.transitionState("CONNECTING");
      this.registerSocketEvents();
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      this.transitionState("ERROR");
      this.scheduleReconnect();
    }
  }

  disconnect(options?: { suppressReconnect?: boolean }) {
    this.manualClose = options?.suppressReconnect ?? false;
    if (this.ws) {
      this.transitionState("CLOSING");
      this.ws.close();
      this.ws = null;
    }
    this.cleanupTimers();
    this.transitionState("CLOSED");
  }

  sendMessage(
    message: Record<string, unknown>,
    options: { requireAuth?: boolean } = { requireAuth: true },
  ) {
    const requireAuth = options.requireAuth ?? true;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queueMessage(message, requireAuth);
      console.warn("WebSocket is not open. Queuing message:", message);
      return;
    }

    if (requireAuth && !this.isAuthorized) {
      this.queueMessage(message, requireAuth);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Failed to send WebSocket message:", error);
      toaster.create({
        title: `${getTranslation()("error.websocketSendFailed") ?? "WebSocket send error"}`,
        type: "error",
        duration: 2000,
      });
    }
  }

  sendChatMessage(message: WSChatMessage) {
    const parsed = WSChatMessageSchema.safeParse(message);
    if (!parsed.success) {
      console.error("Invalid chat message payload", parsed.error.flatten());
      throw parsed.error;
    }
    this.sendMessage(parsed.data, { requireAuth: true });
  }

  sendInterrupt(message: WSInterruptStreamMessage) {
    const parsed = WSInterruptStreamMessageSchema.safeParse(message);
    if (!parsed.success) {
      console.error("Invalid interrupt payload", parsed.error.flatten());
      throw parsed.error;
    }
    this.sendMessage(parsed.data, { requireAuth: true });
  }

  onMessage(callback: (message: WSServerMessage) => void) {
    return this.messageSubject.subscribe(callback);
  }

  onStateChange(callback: (state: WebSocketConnectionState) => void) {
    return this.stateSubject.subscribe(callback);
  }

  getCurrentState() {
    return this.currentState;
  }

  private registerSocketEvents() {
    if (!this.ws) {
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.isAuthorized = false;
      this.connectionId = null;
      this.transitionState("OPEN");
      this.startHeartbeatMonitor();
      this.sendAuthorize();
    };

    this.ws.onmessage = (event) => {
      this.lastServerMessageAt = Date.now();
      try {
        const raw = JSON.parse(event.data);
        const parsed = WSServerMessageSchema.safeParse(raw);

        if (!parsed.success) {
          console.warn("Received unknown WebSocket message", raw);
          return;
        }

        this.handleServerMessage(parsed.data);
        this.messageSubject.next(parsed.data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        toaster.create({
          title: `${getTranslation()("error.failedParseWebSocket")}: ${error}`,
          type: "error",
          duration: 2000,
        });
      }
    };

    this.ws.onerror = (event) => {
      console.error("WebSocket error", event);
      this.transitionState("ERROR");
    };

    this.ws.onclose = () => {
      this.cleanupTimers();
      this.transitionState("CLOSED");
      const shouldAttemptReconnect = this.shouldReconnect && !this.manualClose;
      this.manualClose = false;
      if (shouldAttemptReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private sendAuthorize() {
    if (!this.authToken) {
      console.warn("No auth token configured for WebSocket connection");
      toaster.create({
        title: getTranslation()("error.websocketMissingToken"),
        type: "error",
        duration: 2000,
      });
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.transitionState("AUTHORIZING");
    const authMessage = WSAuthorizeMessageSchema.parse({
      type: "authorize",
      token: this.authToken,
    });
    this.ws.send(JSON.stringify(authMessage));
  }

  private handleServerMessage(message: WSServerMessage) {
    switch (message.type) {
      case "authorize_success":
        console.log("[wsService] Authorization successful:", message.connection_id);
        this.isAuthorized = true;
        this.connectionId = message.connection_id;
        this.transitionState("READY");
        this.flushQueuedMessages();
        this.initializeConnection();
        break;
      case "authorize_error":
        this.isAuthorized = false;
        this.transitionState("ERROR");
        toaster.create({
          title: message.error,
          type: "error",
          duration: 3000,
        });
        break;
      case "ping":
        this.sendPong();
        break;
      case "error":
        toaster.create({
          title: message.error,
          type: "error",
          duration: 3000,
        });
        break;
      default:
        break;
    }
  }

  private sendPong() {
    const pong = WSPongMessageSchema.parse({ type: "pong" });
    this.sendMessage(pong, { requireAuth: false });
  }

  private queueMessage(payload: Record<string, unknown>, requireAuth: boolean) {
    this.queuedMessages.push({ payload, requireAuth });
  }

  private flushQueuedMessages() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const remaining: QueuedMessage[] = [];

    this.queuedMessages.forEach((item) => {
      if (item.requireAuth && !this.isAuthorized) {
        remaining.push(item);
        return;
      }
      try {
        this.ws?.send(JSON.stringify(item.payload));
      } catch (error) {
        console.error("Failed to flush queued message", error);
        remaining.push(item);
      }
    });

    this.queuedMessages = remaining;
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || !this.url) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Max WebSocket reconnect attempts reached");
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay =
      this.reconnectBackoffMs * Math.max(1, this.reconnectAttempts + 1);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      console.info(
        `Reconnecting WebSocket (attempt ${this.reconnectAttempts})`,
      );
      this.connect(this.url!);
    }, delay);
  }

  private startHeartbeatMonitor() {
    this.lastServerMessageAt = Date.now();
    this.stopHeartbeatMonitor();
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.lastServerMessageAt > this.heartbeatTimeoutMs) {
        console.warn("WebSocket heartbeat timeout. Reconnecting...");
        this.disconnect({ suppressReconnect: false });
      }
    }, this.heartbeatTimeoutMs);
  }

  private stopHeartbeatMonitor() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private cleanupTimers() {
    this.stopHeartbeatMonitor();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private transitionState(state: WebSocketConnectionState) {
    this.currentState = state;
    this.stateSubject.next(state);
  }
}

export const wsService = WebSocketService.getInstance();
