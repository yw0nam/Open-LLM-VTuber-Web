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
  },
  version: "1.0.0",
  lastUpdated: new Date().toISOString(),
};

/**
 * Configuration keys for localStorage
 */
export const CONFIG_STORAGE_KEY = "desktopmate_config";
export const CONFIG_VERSION = "1.0.0";
