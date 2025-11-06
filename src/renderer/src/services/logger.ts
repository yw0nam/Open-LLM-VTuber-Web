/**
 * Logging Utilities for DesktopMate+
 * Centralized logging with feature flag support, formatting, and log levels
 */

/**
 * Log Levels
 * Ordered by severity (lower number = more severe)
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Log Entry Interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  stack?: string;
}

/**
 * Logger Configuration
 */
export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredLogs: number;
  includeStack: boolean;
}

/**
 * Default Logger Configuration
 */
const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  minLevel: LogLevel.INFO,
  enableConsole: true,
  enableStorage: false,
  maxStoredLogs: 1000,
  includeStack: true,
};

/**
 * Logger Class
 * Provides structured logging with feature flag integration
 */
class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private isDevelopment: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.isDevelopment =
      process.env.NODE_ENV === "development" ||
      !process.env.NODE_ENV ||
      window.location.hostname === "localhost";
  }

  /**
   * Update logger configuration
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }

  /**
   * Format log entry for console output
   */
  private formatConsoleMessage(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level].padEnd(5);
    const contextStr = entry.context ? `[${entry.context}]` : "";
    const metaStr = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : "";

    return `${entry.timestamp} ${levelStr} ${contextStr} ${entry.message}${metaStr}`;
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.ERROR:
        return console.error;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.DEBUG:
        return console.debug;
      default:
        return console.log;
    }
  }

  /**
   * Get color for log level (for styling)
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return "color: #ff4444; font-weight: bold";
      case LogLevel.WARN:
        return "color: #ff9800; font-weight: bold";
      case LogLevel.INFO:
        return "color: #2196f3";
      case LogLevel.DEBUG:
        return "color: #9e9e9e";
      default:
        return "";
    }
  }

  /**
   * Core logging function
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error,
  ): void {
    // Check if logging is enabled via feature flag (in development, always log)
    if (!this.isDevelopment) {
      // In production, respect configuration
      // You can add feature flag checks here if needed
      // e.g., if (!configManager.isFeatureEnabled('enableLogging')) return;
    }

    // Check minimum log level
    if (level > this.config.minLevel) {
      return;
    }

    // Create log entry
    const entry: LogEntry = {
      level,
      message,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      stack:
        error?.stack ||
        (this.config.includeStack && level === LogLevel.ERROR
          ? new Error().stack
          : undefined),
    };

    // Console output
    if (this.config.enableConsole) {
      const consoleMethod = this.getConsoleMethod(level);
      const formattedMessage = this.formatConsoleMessage(entry);

      if (this.isDevelopment) {
        // Styled console output in development
        const levelColor = this.getLevelColor(level);
        consoleMethod(
          `%c${LogLevel[level]}%c ${entry.timestamp} ${context ? `[${context}]` : ""} ${message}`,
          levelColor,
          "",
          metadata || "",
        );
        if (entry.stack && level === LogLevel.ERROR) {
          console.error(entry.stack);
        }
      } else {
        // Plain console output in production
        consoleMethod(formattedMessage);
        if (entry.stack && level === LogLevel.ERROR) {
          consoleMethod(entry.stack);
        }
      }
    }

    // Store in buffer
    if (this.config.enableStorage) {
      this.logBuffer.push(entry);

      // Trim buffer if exceeded max size
      if (this.logBuffer.length > this.config.maxStoredLogs) {
        this.logBuffer.shift();
      }
    }
  }

  /**
   * Log debug message
   */
  public debug(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * Log info message
   */
  public info(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * Log warning message
   */
  public warn(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  /**
   * Log error message
   */
  public error(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error,
  ): void {
    this.log(LogLevel.ERROR, message, context, metadata, error);
  }

  /**
   * Get stored logs
   */
  public getLogs(
    level?: LogLevel,
    context?: string,
    limit?: number,
  ): ReadonlyArray<LogEntry> {
    let filtered = [...this.logBuffer];

    if (level !== undefined) {
      filtered = filtered.filter((entry) => entry.level === level);
    }

    if (context) {
      filtered = filtered.filter((entry) => entry.context === context);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Clear stored logs
   */
  public clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export convenience functions
export const debugLog = (
  message: string,
  context?: string,
  metadata?: Record<string, any>,
) => logger.debug(message, context, metadata);

export const infoLog = (
  message: string,
  context?: string,
  metadata?: Record<string, any>,
) => logger.info(message, context, metadata);

export const warnLog = (
  message: string,
  context?: string,
  metadata?: Record<string, any>,
) => logger.warn(message, context, metadata);

export const errorLog = (
  message: string,
  context?: string,
  metadata?: Record<string, any>,
  error?: Error,
) => logger.error(message, context, metadata, error);

// Export Logger class for custom instances
export { Logger };
