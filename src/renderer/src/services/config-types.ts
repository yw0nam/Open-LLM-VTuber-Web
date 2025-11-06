/**
 * Configuration types for DesktopMate+
 * This file contains all TypeScript interfaces and types for configuration management
 */

/**
 * URL Configuration
 * Contains all endpoint URLs used by the application
 */
export interface URLConfiguration {
  /** WebSocket URL for chat streaming */
  wsUrl: string;
  /** Base URL for HTTP API calls */
  baseUrl: string;
  /** TTS (Text-to-Speech) API endpoint */
  tts: string;
  /** VLM (Vision-Language Model) API endpoint */
  vlm: string;
  /** STM (Short-Term Memory) API base endpoint */
  stm: string;
}

/**
 * Feature Flags
 * Toggle features on/off at runtime
 */
export interface FeatureFlags {
  /** Enable subtitle display */
  showSubtitle: boolean;
  /** Enable camera background */
  useCameraBackground: boolean;
  /** Enable proactive speaking by AI agent */
  allowProactiveSpeak: boolean;
  /** Enable manual button trigger for proactive speaking */
  allowButtonTrigger: boolean;
}

/**
 * Performance Parameters
 * Configure performance-related settings
 */
export interface PerformanceParameters {
  /** Image compression quality (0.0 - 1.0) */
  imageCompressionQuality: number;
  /** Maximum image width (0 = no limit) */
  imageMaxWidth: number;
  /** Idle seconds before AI speaks proactively */
  idleSecondsToSpeak: number;
}

/**
 * UI Preferences
 * User interface related settings
 */
export interface UIPreferences {
  /** Current language code (e.g., 'en', 'zh') */
  language: string;
  /** Selected character preset filename */
  selectedCharacterPreset: string | null;
  /** Background URL or path */
  backgroundUrl: string;
  /** Custom background URL (if not using preset) */
  customBgUrl: string;
  /** Default TTS voice */
  defaultVoice: string;
}

/**
 * Complete Application Configuration
 * Combines all configuration sections
 */
export interface AppConfiguration {
  urls: URLConfiguration;
  features: FeatureFlags;
  performance: PerformanceParameters;
  ui: UIPreferences;
  /** Configuration version for migration support */
  version: string;
  /** Last update timestamp */
  lastUpdated: string;
}

/**
 * Configuration Update Event
 * Fired when configuration changes
 */
export interface ConfigurationUpdateEvent {
  /** Which section of config changed */
  section: keyof AppConfiguration;
  /** The updated value */
  value: unknown;
  /** Timestamp of the update */
  timestamp: string;
}

/**
 * Configuration Validation Result
 */
export interface ValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfiguration = {
  urls: {
    wsUrl: "ws://127.0.0.1:5500/v1/chat/stream",
    baseUrl: "http://127.0.0.1:5500",
    tts: "http://127.0.0.1:5500/v1/tts/synthesize",
    vlm: "http://127.0.0.1:5500/v1/vlm/analyze",
    stm: "http://127.0.0.1:5500/v1/stm",
  },
  features: {
    showSubtitle: true,
    useCameraBackground: false,
    allowProactiveSpeak: true,
    allowButtonTrigger: true,
  },
  performance: {
    imageCompressionQuality: 0.8,
    imageMaxWidth: 0,
    idleSecondsToSpeak: 30,
  },
  ui: {
    language: "en",
    selectedCharacterPreset: null,
    backgroundUrl: "",
    customBgUrl: "",
    defaultVoice: "default",
  },
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
};

/**
 * Configuration keys for localStorage
 */
export const CONFIG_STORAGE_KEY = "desktopmate_config";
export const CONFIG_VERSION = "1.0.0";

// ============================================================================
// API REQUEST & RESPONSE TYPES
// ============================================================================

/**
 * TTS Synthesis Request
 */
export interface TTSRequest {
  text: string;
  reference_id?: string;
  output_format?: "bytes" | "base64";
}

/**
 * TTS Synthesis Response
 */
export interface TTSResponse {
  audio_data: string;
  format: string;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  services: {
    [serviceName: string]: {
      status: "healthy" | "unhealthy";
      message?: string;
    };
  };
}

/**
 * VLM (Vision-Language Model) Request
 */
export interface VLMRequest {
  image: string;
  prompt?: string;
}

/**
 * VLM Response
 */
export interface VLMResponse {
  description: string;
}

/**
 * API Error Response
 */
export interface APIErrorResponse {
  detail: string;
  code?: number;
  errors?: string[];
}

/**
 * Agent Configuration
 */
export interface AgentConfig {
  agent_id: string;
  user_id: string;
  persona?: string;
  memory_limit?: number;
  streaming?: boolean;
}

/**
 * Session Information
 */
export interface SessionInfo {
  session_id: string;
  conversation_id: string;
  agent_id: string;
  user_id: string;
  created_at: string;
  last_active: string;
}

// ============================================================================
// STM (Short-Term Memory) API TYPES
// ============================================================================

/**
 * Message type for STM chat history
 */
export type STMMessageType = "human" | "ai" | "system";

/**
 * Single message in STM format
 */
export interface STMMessage {
  type: STMMessageType;
  content: string;
}

/**
 * Add Chat History Request
 */
export interface AddChatHistoryRequest {
  user_id: string;
  agent_id: string;
  session_id?: string;
  messages: STMMessage[];
}

/**
 * Add Chat History Response
 */
export interface AddChatHistoryResponse {
  session_id: string;
  message_count: number;
}

/**
 * Get Chat History Request (query parameters)
 */
export interface GetChatHistoryRequest {
  user_id: string;
  agent_id: string;
  session_id: string;
  limit?: number;
}

/**
 * Get Chat History Response
 */
export interface GetChatHistoryResponse {
  session_id: string;
  messages: STMMessage[];
}

/**
 * List Sessions Request (query parameters)
 */
export interface ListSessionsRequest {
  user_id: string;
  agent_id: string;
}

/**
 * Session Metadata
 */
export interface SessionMetadata {
  session_id: string;
  user_id: string;
  agent_id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

/**
 * List Sessions Response
 */
export interface ListSessionsResponse {
  sessions: SessionMetadata[];
}

/**
 * Delete Session Request (query parameters)
 */
export interface DeleteSessionRequest {
  session_id: string;
  user_id: string;
  agent_id: string;
}

/**
 * Delete Session Response
 */
export interface DeleteSessionResponse {
  success: boolean;
  message: string;
}

/**
 * Update Session Metadata Request
 * Note: session_id should be passed as path parameter
 */
export interface UpdateSessionMetadataRequest {
  session_id: string; // Required in request body even though it's also a path parameter
  metadata: Record<string, unknown>;
}

/**
 * Update Session Metadata Response
 */
export interface UpdateSessionMetadataResponse {
  success: boolean;
  message: string;
}
