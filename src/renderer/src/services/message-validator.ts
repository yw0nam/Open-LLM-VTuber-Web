/**
 * Message Validation and Sanitization Service
 *
 * Provides runtime validation and sanitization for WebSocket messages
 * to ensure type safety and prevent security vulnerabilities.
 */

import { MessageType } from './message-types';
import { debugLog, errorLog } from './logger';

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: any;
}

/**
 * Message Validator
 * Validates and sanitizes incoming WebSocket messages
 */
export class MessageValidator {
  /**
   * Validates that a value is a non-empty string
   */
  private static isNonEmptyString(value: any): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Validates that a value is a valid number
   */
  private static isValidNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }

  /**
   * Validates that a value is a valid timestamp (positive number or ISO date string)
   */
  private static isValidTimestamp(value: any): boolean {
    // Accept positive numbers (Unix timestamps in milliseconds)
    if (this.isValidNumber(value)) {
      return value >= 0;
    }
    
    // Accept valid ISO 8601 date strings
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    
    return false;
  }

  /**
   * Validates that a value is an object (not null, not array)
   */
  private static isObject(value: any): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Sanitizes text content by removing potentially dangerous characters
   * and limiting length
   */
  static sanitizeText(text: string, maxLength: number = 100000): string {
    if (typeof text !== 'string') {
      return '';
    }

    // Remove null bytes
    let sanitized = text.replace(/\0/g, '');

    // Remove control characters except newline, tab, and carriage return
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Trim to max length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitizes an object by recursively sanitizing all string values
   */
  static sanitizeObject(obj: any, maxDepth: number = 10): any {
    if (maxDepth <= 0) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1));
    }

    if (this.isObject(obj)) {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeText(key, 1000);
        sanitized[sanitizedKey] = this.sanitizeObject(value, maxDepth - 1);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validates base message structure
   */
  static validateBaseMessage(msg: any): ValidationResult {
    const errors: string[] = [];

    if (!this.isObject(msg)) {
      errors.push('Message must be an object');
      return { valid: false, errors };
    }

    if (!msg.type || typeof msg.type !== 'string') {
      errors.push('Message must have a valid type field');
    }

    if (msg.timestamp !== undefined) {
      if (!this.isValidTimestamp(msg.timestamp)) {
        errors.push('Timestamp must be a valid positive number or ISO date string');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates AuthorizeSuccess message
   */
  static validateAuthorizeSuccess(msg: any): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateBaseMessage(msg);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    if (!this.isNonEmptyString(msg.connection_id)) {
      errors.push('connection_id must be a non-empty string');
    }

    const sanitized = {
      ...msg,
      connection_id: this.sanitizeText(msg.connection_id || ''),
    };

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates AuthorizeError message
   */
  static validateAuthorizeError(msg: any): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateBaseMessage(msg);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    if (!this.isNonEmptyString(msg.error)) {
      errors.push('error must be a non-empty string');
    }

    const sanitized = {
      ...msg,
      error: this.sanitizeText(msg.error || ''),
    };

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates ChatResponse message
   */
  static validateChatResponse(msg: any): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateBaseMessage(msg);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    if (!this.isNonEmptyString(msg.content)) {
      errors.push('content must be a non-empty string');
    }

    const sanitized: any = {
      ...msg,
      content: this.sanitizeText(msg.content || ''),
    };

    if (msg.metadata !== undefined) {
      if (!this.isObject(msg.metadata)) {
        errors.push('metadata must be an object');
      } else {
        sanitized.metadata = this.sanitizeObject(msg.metadata);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates StreamToken message
   */
  static validateStreamToken(msg: any): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateBaseMessage(msg);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    if (msg.chunk !== undefined && typeof msg.chunk !== 'string') {
      errors.push('chunk must be a string');
    }

    if (msg.token !== undefined && typeof msg.token !== 'string') {
      errors.push('token must be a string');
    }

    const sanitized: any = {
      ...msg,
    };

    if (msg.chunk !== undefined) {
      sanitized.chunk = this.sanitizeText(msg.chunk);
    }

    if (msg.token !== undefined) {
      sanitized.token = this.sanitizeText(msg.token);
    }

    if (msg.turn_id !== undefined) {
      sanitized.turn_id = this.sanitizeText(msg.turn_id);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates Error message
   */
  static validateError(msg: any): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateBaseMessage(msg);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const sanitized: any = {
      ...msg,
    };

    if (msg.error !== undefined) {
      sanitized.error = this.sanitizeText(msg.error);
    }

    if (msg.message !== undefined) {
      sanitized.message = this.sanitizeText(msg.message);
    }

    if (msg.code !== undefined) {
      if (!this.isValidNumber(msg.code)) {
        errors.push('code must be a valid number');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validates TTSReadyChunk message
   */
  static validateTTSReadyChunk(msg: any): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateBaseMessage(msg);
    
    if (!baseValidation.valid) {
      return baseValidation;
    }

    const sanitized: any = {
      ...msg,
    };

    if (msg.chunk !== undefined) {
      sanitized.chunk = this.sanitizeText(msg.chunk);
    }

    if (msg.audio_chunk !== undefined) {
      sanitized.audio_chunk = this.sanitizeText(msg.audio_chunk);
    }

    if (msg.emotion !== undefined) {
      sanitized.emotion = this.sanitizeText(msg.emotion);
    }

    if (msg.turn_id !== undefined) {
      sanitized.turn_id = this.sanitizeText(msg.turn_id);
    }

    if (msg.chunk_index !== undefined && !this.isValidNumber(msg.chunk_index)) {
      errors.push('chunk_index must be a valid number');
    }

    if (msg.total_chunks !== undefined && !this.isValidNumber(msg.total_chunks)) {
      errors.push('total_chunks must be a valid number');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Main validation entry point
   * Validates a server message based on its type
   */
  static validateServerMessage(msg: any): ValidationResult {
    debugLog('message-validator', 'Validating message', { type: msg?.type });

    // First check if message has basic structure
    const baseValidation = this.validateBaseMessage(msg);
    if (!baseValidation.valid) {
      errorLog(
        'message-validator',
        'Base message validation failed',
        new Error(baseValidation.errors.join(', '))
      );
      return baseValidation;
    }

    // Validate based on message type
    let validation: ValidationResult;

    switch (msg.type) {
      case MessageType.AUTHORIZE_SUCCESS:
        validation = this.validateAuthorizeSuccess(msg);
        break;

      case MessageType.AUTHORIZE_ERROR:
        validation = this.validateAuthorizeError(msg);
        break;

      case MessageType.CHAT_RESPONSE:
        validation = this.validateChatResponse(msg);
        break;

      case MessageType.STREAM_TOKEN:
        validation = this.validateStreamToken(msg);
        break;

      case MessageType.TTS_READY_CHUNK:
        validation = this.validateTTSReadyChunk(msg);
        break;

      case MessageType.ERROR:
        validation = this.validateError(msg);
        break;

      case MessageType.PING:
        // PING messages only need base validation
        validation = {
          valid: true,
          errors: [],
          sanitized: msg,
        };
        break;

      case MessageType.STREAM_START:
      case MessageType.STREAM_END:
        // Simple messages with optional turn_id
        validation = {
          valid: true,
          errors: [],
          sanitized: {
            ...msg,
            turn_id: msg.turn_id ? this.sanitizeText(msg.turn_id) : undefined,
          },
        };
        break;

      default:
        // For unknown message types, sanitize the entire object
        debugLog('message-validator', 'Unknown message type, applying generic validation', {
          type: msg.type,
        });
        validation = {
          valid: true,
          errors: [],
          sanitized: this.sanitizeObject(msg),
        };
    }

    if (!validation.valid) {
      errorLog(
        'message-validator',
        `Message validation failed for type ${msg.type}`,
        new Error(validation.errors.join(', '))
      );
    } else {
      debugLog('message-validator', 'Message validated successfully', {
        type: msg.type,
      });
    }

    return validation;
  }
}

// Export convenience functions
export const validateServerMessage = MessageValidator.validateServerMessage.bind(MessageValidator);
export const sanitizeText = MessageValidator.sanitizeText.bind(MessageValidator);
export const sanitizeObject = MessageValidator.sanitizeObject.bind(MessageValidator);
