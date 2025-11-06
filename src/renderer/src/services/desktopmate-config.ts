/**
 * DesktopMate+ Centralized Configuration Service
 * Manages application configuration with localStorage persistence
 */

import {
  AppConfiguration,
  CONFIG_STORAGE_KEY,
  CONFIG_VERSION,
  DEFAULT_CONFIG,
  ConfigurationUpdateEvent,
  ValidationResult,
} from "./config-types";

/**
 * Configuration change callback type
 */
type ConfigChangeCallback = (event: ConfigurationUpdateEvent) => void;

/**
 * DesktopMate Configuration Manager
 * Singleton class for managing application configuration
 */
class DesktopMateConfig {
  private config: AppConfiguration;
  private listeners: Set<ConfigChangeCallback> = new Set();

  constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Load configuration from localStorage
   * Applies defaults if configuration is missing or invalid
   */
  private loadConfiguration(): AppConfiguration {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);

      if (!stored) {
        console.debug("[Config] No stored configuration found, using defaults");
        return this.getDefaultConfig();
      }

      const parsed = JSON.parse(stored) as AppConfiguration;

      // Version migration check
      if (parsed.version !== CONFIG_VERSION) {
        console.debug(
          `[Config] Version mismatch (stored: ${parsed.version}, current: ${CONFIG_VERSION}), migrating...`,
        );
        return this.migrateConfiguration(parsed);
      }

      // Merge with defaults to ensure all properties exist
      const merged = this.mergeWithDefaults(parsed);
      console.debug("[Config] Configuration loaded successfully");
      return merged;
    } catch (error) {
      console.error("[Config] Failed to load configuration:", error);
      console.debug("[Config] Falling back to default configuration");
      return this.getDefaultConfig();
    }
  }

  /**
   * Save configuration to localStorage
   * Handles JSON stringification errors gracefully
   */
  private saveConfiguration(): void {
    try {
      // Update timestamp before saving
      this.config.lastUpdated = new Date().toISOString();

      const serialized = JSON.stringify(this.config);
      localStorage.setItem(CONFIG_STORAGE_KEY, serialized);
      console.debug("[Config] Configuration saved successfully");
    } catch (error) {
      console.error("[Config] Failed to save configuration:", error);
      throw new Error("Failed to persist configuration");
    }
  }

  /**
   * Get a fresh copy of default configuration
   */
  private getDefaultConfig(): AppConfiguration {
    return {
      ...DEFAULT_CONFIG,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Merge stored config with defaults to ensure all properties exist
   */
  private mergeWithDefaults(
    stored: Partial<AppConfiguration>,
  ): AppConfiguration {
    return {
      urls: { ...DEFAULT_CONFIG.urls, ...(stored.urls || {}) },
      features: { ...DEFAULT_CONFIG.features, ...(stored.features || {}) },
      performance: {
        ...DEFAULT_CONFIG.performance,
        ...(stored.performance || {}),
      },
      ui: { ...DEFAULT_CONFIG.ui, ...(stored.ui || {}) },
      version: stored.version || CONFIG_VERSION,
      lastUpdated: stored.lastUpdated || new Date().toISOString(),
    };
  }

  /**
   * Migrate configuration from older versions
   */
  private migrateConfiguration(oldConfig: AppConfiguration): AppConfiguration {
    // For now, just merge with defaults and update version
    // In the future, add specific migration logic here
    const migrated = this.mergeWithDefaults(oldConfig);
    migrated.version = CONFIG_VERSION;
    this.saveConfiguration();
    return migrated;
  }

  /**
   * Get the complete configuration object
   */
  public getConfig(): Readonly<AppConfiguration> {
    return { ...this.config };
  }

  /**
   * Get a specific configuration section
   */
  public getSection<K extends keyof AppConfiguration>(
    section: K,
  ): Readonly<AppConfiguration[K]> {
    const sectionData = this.config[section];
    if (typeof sectionData === "object" && sectionData !== null) {
      return { ...(sectionData as object) } as AppConfiguration[K];
    }
    return sectionData;
  }

  /**
   * Update a configuration section
   * Atomically updates and persists the configuration
   */
  public updateSection<K extends keyof AppConfiguration>(
    section: K,
    updates: Partial<AppConfiguration[K]>,
  ): void {
    try {
      // Create updated section
      const updatedSection = {
        ...(this.config[section] as object),
        ...updates,
      } as AppConfiguration[K];

      // Update in-memory config
      this.config = {
        ...this.config,
        [section]: updatedSection,
      };

      // Persist to localStorage
      this.saveConfiguration();

      // Notify listeners
      this.notifyListeners({
        section,
        value: updatedSection,
        timestamp: new Date().toISOString(),
      });

      console.debug(`[Config] Updated section: ${section}`, updates);
    } catch (error) {
      console.error(`[Config] Failed to update section ${section}:`, error);
      throw error;
    }
  }

  /**
   * Update a specific configuration value
   */
  public updateValue<
    K extends keyof AppConfiguration,
    V extends keyof AppConfiguration[K],
  >(section: K, key: V, value: AppConfiguration[K][V]): void {
    this.updateSection(section, { [key]: value } as unknown as Partial<
      AppConfiguration[K]
    >);
  }

  /**
   * Toggle a feature flag
   */
  public toggleFeature(featureKey: keyof AppConfiguration["features"]): void {
    const currentValue = this.config.features[featureKey];
    this.updateValue("features", featureKey, !currentValue);
    console.debug(`[Config] Toggled feature ${featureKey}: ${!currentValue}`);
  }

  /**
   * Enable a feature flag
   */
  public enableFeature(featureKey: keyof AppConfiguration["features"]): void {
    this.updateValue("features", featureKey, true);
    console.debug(`[Config] Enabled feature: ${featureKey}`);
  }

  /**
   * Disable a feature flag
   */
  public disableFeature(featureKey: keyof AppConfiguration["features"]): void {
    this.updateValue("features", featureKey, false);
    console.debug(`[Config] Disabled feature: ${featureKey}`);
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(
    featureKey: keyof AppConfiguration["features"],
  ): boolean {
    return this.config.features[featureKey];
  }

  /**
   * Update URL with validation
   * Automatically validates and falls back to default if invalid
   */
  public updateUrl(urlKey: keyof AppConfiguration["urls"], url: string): void {
    if (!this.isValidUrl(url)) {
      console.warn(
        `[Config] Invalid URL provided for ${urlKey}: ${url}, using default`,
      );
      const defaultUrl = DEFAULT_CONFIG.urls[urlKey];
      this.updateValue("urls", urlKey, defaultUrl);
      return;
    }

    this.updateValue("urls", urlKey, url);
    console.debug(`[Config] Updated ${urlKey}: ${url}`);
  }

  /**
   * Reset configuration to defaults
   */
  public resetToDefaults(): void {
    try {
      this.config = this.getDefaultConfig();
      this.saveConfiguration();

      // Notify all sections changed
      Object.keys(this.config).forEach((section) => {
        if (section !== "version" && section !== "lastUpdated") {
          this.notifyListeners({
            section: section as keyof AppConfiguration,
            value: this.config[section as keyof AppConfiguration],
            timestamp: new Date().toISOString(),
          });
        }
      });

      console.debug("[Config] Reset to default configuration");
    } catch (error) {
      console.error("[Config] Failed to reset configuration:", error);
      throw error;
    }
  }

  /**
   * Validate the current configuration
   */
  public validate(): ValidationResult {
    const errors: string[] = [];

    // Validate URLs
    if (!this.isValidUrl(this.config.urls.wsUrl)) {
      errors.push(`Invalid WebSocket URL: ${this.config.urls.wsUrl}`);
    }
    if (!this.isValidUrl(this.config.urls.baseUrl)) {
      errors.push(`Invalid base URL: ${this.config.urls.baseUrl}`);
    }

    // Validate performance parameters
    if (
      this.config.performance.imageCompressionQuality < 0 ||
      this.config.performance.imageCompressionQuality > 1
    ) {
      errors.push(
        `Image compression quality must be between 0 and 1: ${this.config.performance.imageCompressionQuality}`,
      );
    }

    if (this.config.performance.imageMaxWidth < 0) {
      errors.push(
        `Image max width must be non-negative: ${this.config.performance.imageMaxWidth}`,
      );
    }

    if (this.config.performance.idleSecondsToSpeak < 0) {
      errors.push(
        `Idle seconds must be non-negative: ${this.config.performance.idleSecondsToSpeak}`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ["http:", "https:", "ws:", "wss:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(callback: ConfigChangeCallback): () => void {
    this.listeners.add(callback);
    console.debug("[Config] Listener subscribed, total:", this.listeners.size);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      console.debug(
        "[Config] Listener unsubscribed, total:",
        this.listeners.size,
      );
    };
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(event: ConfigurationUpdateEvent): void {
    this.listeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("[Config] Error in listener callback:", error);
      }
    });
  }

  /**
   * Export configuration as JSON string
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON string
   */
  public importConfig(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString) as AppConfiguration;
      const validation = this.validate();

      if (!validation.valid) {
        throw new Error(
          `Invalid configuration: ${validation.errors.join(", ")}`,
        );
      }

      this.config = this.mergeWithDefaults(imported);
      this.saveConfiguration();

      console.debug("[Config] Configuration imported successfully");
    } catch (error) {
      console.error("[Config] Failed to import configuration:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const configManager = new DesktopMateConfig();

// Export class for testing
export { DesktopMateConfig };
