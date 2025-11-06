/**
 * WebSocket Message Types for DesktopMate+
 * Comprehensive type definitions for all client-server communication
 */

/**
 * Message Type Discriminator
 * Used for type-safe message handling with discriminated unions
 */
export enum MessageType {
  // Client -> Server Messages
  AUTHORIZE = "authorize",
  PONG = "pong",
  CHAT_MESSAGE = "chat_message",
  INTERRUPT_STREAM = "interrupt_stream",
  TEXT_INPUT = "text-input",
  FETCH_BACKGROUNDS = "fetch-backgrounds",
  FETCH_CONFIGS = "fetch-configs",
  FETCH_HISTORY_LIST = "fetch-history-list",
  CREATE_NEW_HISTORY = "create-new-history",

  // Server -> Client Messages
  AUTHORIZE_SUCCESS = "authorize_success",
  AUTHORIZE_ERROR = "authorize_error",
  PING = "ping",
  CHAT_RESPONSE = "chat_response",
  STREAM_START = "stream_start",
  STREAM_END = "stream_end",
  STREAM_TOKEN = "stream_token",
  TTS_READY_CHUNK = "tts_ready_chunk",
  TOOL_CALL = "tool_call",
  TOOL_RESULT = "tool_result",
  TOOL_CALL_STATUS = "tool_call_status",
  ERROR = "error",
  AUDIO = "audio",
  TEXT = "text",
}

/**
 * Base Message Interface
 * All WebSocket messages extend this interface
 */
export interface BaseMessage {
  type: MessageType | string;
  id?: string;
  timestamp?: number | string;
}

/**
 * Display Text Information
 * Used for rendering messages with character name and avatar
 */
export interface DisplayText {
  text: string;
  name: string;
  avatar: string;
}

/**
 * Actions for Live2D model and UI effects
 */
export interface Actions {
  expressions?: string[] | number[];
  pictures?: string[];
  sounds?: string[];
}

/**
 * Background File Information
 */
export interface BackgroundFile {
  name: string;
  url: string;
}

/**
 * Configuration File Information
 */
export interface ConfigFile {
  filename: string;
  name: string;
}

/**
 * Live2D Model Information
 */
export interface ModelInfo {
  url: string;
  scrollToResize?: boolean;
  scale?: number;
  [key: string]: any;
}

/**
 * Chat History Information
 */
export interface HistoryInfo {
  history_uid: string;
  messages: ChatHistoryMessage[];
  timestamp?: string;
}

/**
 * Chat History Message
 */
export interface ChatHistoryMessage {
  id: string;
  content: string;
  role: "ai" | "human";
  timestamp: string;
  name?: string;
  avatar?: string;
  type?: "text" | "tool_call_status";
  tool_id?: string;
  tool_name?: string;
  status?: "running" | "completed" | "error";
}

/**
 * Browser View Information (for automation/debugging)
 */
export interface BrowserView {
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
}

// ============================================================================
// CLIENT -> SERVER MESSAGES
// ============================================================================

/**
 * Client Authorization Message
 * First message sent by client after connection
 */
export interface AuthorizeMessage extends BaseMessage {
  type: MessageType.AUTHORIZE;
  token: string;
}

/**
 * Client Pong Message
 * Response to server ping for heartbeat
 */
export interface PongMessage extends BaseMessage {
  type: MessageType.PONG;
}

/**
 * Client Chat Message
 * Main message type for user input
 */
export interface ChatMessage extends BaseMessage {
  type: MessageType.CHAT_MESSAGE;
  content: string;
  agent_id: string;
  user_id: string;
  persona?: string;
  images?: string[];
  limit?: number;
  conversation_id?: string;
  metadata?: {
    [key: string]: any;
  };
}

/**
 * Client Interrupt Stream Message
 * Stops current agent response stream
 */
export interface InterruptStreamMessage extends BaseMessage {
  type: MessageType.INTERRUPT_STREAM;
  turn_id?: string;
}

/**
 * Client Text Input Message
 * User text input with optional images
 */
export interface TextInputMessage extends BaseMessage {
  type: MessageType.TEXT_INPUT;
  text: string;
  images?: string[];
}

/**
 * Client Fetch Backgrounds Message
 */
export interface FetchBackgroundsMessage extends BaseMessage {
  type: MessageType.FETCH_BACKGROUNDS;
}

/**
 * Client Fetch Configs Message
 */
export interface FetchConfigsMessage extends BaseMessage {
  type: MessageType.FETCH_CONFIGS;
}

/**
 * Client Fetch History List Message
 */
export interface FetchHistoryListMessage extends BaseMessage {
  type: MessageType.FETCH_HISTORY_LIST;
}

/**
 * Client Create New History Message
 */
export interface CreateNewHistoryMessage extends BaseMessage {
  type: MessageType.CREATE_NEW_HISTORY;
}

// ============================================================================
// SERVER -> CLIENT MESSAGES
// ============================================================================

/**
 * Server Authorization Success Message
 */
export interface AuthorizeSuccessMessage extends BaseMessage {
  type: MessageType.AUTHORIZE_SUCCESS;
  connection_id: string;
}

/**
 * Server Authorization Error Message
 */
export interface AuthorizeErrorMessage extends BaseMessage {
  type: MessageType.AUTHORIZE_ERROR;
  error: string;
}

/**
 * Server Ping Message
 * Heartbeat to keep connection alive
 */
export interface PingMessage extends BaseMessage {
  type: MessageType.PING;
}

/**
 * Server Chat Response Message
 */
export interface ChatResponseMessage extends BaseMessage {
  type: MessageType.CHAT_RESPONSE;
  content: string;
  metadata?: {
    turn_id?: string;
    conversation_id?: string;
    [key: string]: any;
  };
}

/**
 * Server Stream Start Message
 * Indicates beginning of agent response stream
 */
export interface StreamStartMessage extends BaseMessage {
  type: MessageType.STREAM_START;
  turn_id?: string;
}

/**
 * Server Stream End Message
 * Indicates end of agent response stream
 */
export interface StreamEndMessage extends BaseMessage {
  type: MessageType.STREAM_END;
  turn_id?: string;
}

/**
 * Server Stream Token Message
 * Individual token from LLM (internal use, not typically shown to user)
 */
export interface StreamTokenMessage extends BaseMessage {
  type: MessageType.STREAM_TOKEN;
  chunk: string;
  turn_id?: string;
}

/**
 * Server TTS Ready Chunk Message
 * Complete sentence/phrase ready for text-to-speech synthesis
 * This is the primary event for real-time TTS playback
 */
export interface TTSReadyChunkMessage extends BaseMessage {
  type: MessageType.TTS_READY_CHUNK;
  chunk: string;
  emotion?: string;
  turn_id?: string;
}

/**
 * Server Tool Call Message
 * Indicates agent is calling a tool
 */
export interface ToolCallMessage extends BaseMessage {
  type: MessageType.TOOL_CALL;
  tool_id: string;
  tool_name: string;
  tool_input?: any;
  turn_id?: string;
}

/**
 * Server Tool Result Message
 * Result from tool execution
 */
export interface ToolResultMessage extends BaseMessage {
  type: MessageType.TOOL_RESULT;
  tool_id: string;
  tool_name: string;
  tool_output?: string;
  turn_id?: string;
}

/**
 * Server Tool Call Status Message
 * Status update for tool execution
 */
export interface ToolCallStatusMessage extends BaseMessage {
  type: MessageType.TOOL_CALL_STATUS;
  tool_id: string;
  tool_name: string;
  status: "running" | "completed" | "error";
  content?: string;
}

/**
 * Server Error Message
 */
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  error: string;
  code?: number;
  message?: string;
}

/**
 * Server Audio Message
 * Audio data with volume information for lip sync
 */
export interface AudioMessage extends BaseMessage {
  type: MessageType.AUDIO;
  audio?: string; // base64 encoded audio data
  volumes?: number[];
  slice_length?: number;
  display_text?: DisplayText;
  actions?: Actions;
}

/**
 * Server Text Message
 * Text content with optional metadata
 */
export interface TextMessage extends BaseMessage {
  type: MessageType.TEXT;
  text?: string;
  content?: string;
  display_text?: DisplayText;
  actions?: Actions;
}

/**
 * Generic Server Event Message
 * Flexible message type for various server events
 */
export interface ServerEventMessage extends BaseMessage {
  type: string;
  content?: string;
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
  messages?: ChatHistoryMessage[];
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
  browser_view?: BrowserView;
  tool_id?: any;
  tool_name?: any;
  name?: any;
  status?: any;
}

// ============================================================================
// DISCRIMINATED UNIONS
// ============================================================================

/**
 * All Client Messages
 * Discriminated union of all possible client->server messages
 */
export type ClientMessage =
  | AuthorizeMessage
  | PongMessage
  | ChatMessage
  | InterruptStreamMessage
  | TextInputMessage
  | FetchBackgroundsMessage
  | FetchConfigsMessage
  | FetchHistoryListMessage
  | CreateNewHistoryMessage;

/**
 * All Server Messages
 * Discriminated union of all possible server->client messages
 */
export type ServerMessage =
  | AuthorizeSuccessMessage
  | AuthorizeErrorMessage
  | PingMessage
  | ChatResponseMessage
  | StreamStartMessage
  | StreamEndMessage
  | StreamTokenMessage
  | TTSReadyChunkMessage
  | ToolCallMessage
  | ToolResultMessage
  | ToolCallStatusMessage
  | ErrorMessage
  | AudioMessage
  | TextMessage
  | ServerEventMessage;

/**
 * All WebSocket Messages
 * Discriminated union of all possible messages
 */
export type WebSocketMessage = ClientMessage | ServerMessage;

/**
 * Type guard to check if message is from client
 */
export function isClientMessage(
  message: WebSocketMessage,
): message is ClientMessage {
  const clientTypes = [
    MessageType.AUTHORIZE,
    MessageType.PONG,
    MessageType.CHAT_MESSAGE,
    MessageType.INTERRUPT_STREAM,
    MessageType.TEXT_INPUT,
    MessageType.FETCH_BACKGROUNDS,
    MessageType.FETCH_CONFIGS,
    MessageType.FETCH_HISTORY_LIST,
    MessageType.CREATE_NEW_HISTORY,
  ];
  return clientTypes.includes(message.type as MessageType);
}

/**
 * Type guard to check if message is from server
 */
export function isServerMessage(
  message: WebSocketMessage,
): message is ServerMessage {
  return !isClientMessage(message);
}

/**
 * Type guard for TTS ready chunk messages
 */
export function isTTSReadyChunk(
  message: WebSocketMessage,
): message is TTSReadyChunkMessage {
  return message.type === MessageType.TTS_READY_CHUNK;
}

/**
 * Type guard for audio messages
 */
export function isAudioMessage(
  message: WebSocketMessage,
): message is AudioMessage {
  return message.type === MessageType.AUDIO;
}

/**
 * Type guard for error messages
 */
export function isErrorMessage(
  message: WebSocketMessage,
): message is ErrorMessage {
  return message.type === MessageType.ERROR;
}
