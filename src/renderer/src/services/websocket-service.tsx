import { ModelInfo } from "@/context/setting/live2d-context";
import { HistoryInfo } from "@/context/websocket-context";
import { Message } from "@/types/message";
import { Subject } from "rxjs";
import { ConfigFile } from "@/context/setting/character-context";

interface BackgroundFile {
  name: string;
  url: string;
}

export interface MessageEvent {
  type: string;
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  files?: BackgroundFile[];
  expressions?: string[];
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
  schemas?: any;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private messageSubject = new Subject<MessageEvent>();
  private stateSubject = new Subject<"CONNECTING" | "OPEN" | "CLOSING" | "CLOSED">();

  private constructor() {}

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private initializeConnection() {
    this.sendMessage({
      type: "fetch-backgrounds"
    });
    this.sendMessage({
      type: "fetch-conf-schemas",
    });
    this.sendMessage({
      type: "fetch-conf-info"
    });
    this.sendMessage({
      type: "fetch-history-list"
    });
    this.sendMessage({
      type: "create-new-history"
    });
  }

  connect(url: string) {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(url);
    this.stateSubject.next("CONNECTING");

    this.ws.onopen = () => {
      this.stateSubject.next("OPEN");
      this.initializeConnection();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageSubject.next(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      this.stateSubject.next("CLOSED");
    };

    this.ws.onerror = () => {
      this.stateSubject.next("CLOSED");
    };
  }

  sendMessage(message: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not open. Unable to send message:", message);
    }
  }

  onMessage(callback: (message: MessageEvent) => void) {
    return this.messageSubject.subscribe(callback);
  }

  onStateChange(callback: (state: "CONNECTING" | "OPEN" | "CLOSING" | "CLOSED") => void) {
    return this.stateSubject.subscribe(callback);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = WebSocketService.getInstance();
