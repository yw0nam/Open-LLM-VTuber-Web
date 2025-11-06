/**
 * Message Formatter Service
 *
 * Handles validation and formatting of user messages for transmission to the backend.
 * Converts frontend message format to DesktopMate protocol-compliant chat messages.
 */

import { desktopMateAdapter, ChatContext } from './desktopmate-adapter';
import { ChatMessage } from './message-types';

/**
 * Message validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * User message input
 */
export interface UserMessageInput {
  text: string;
  images?: string[];
}

/**
 * Session metadata for message formatting
 */
export interface SessionMetadata {
  userId: string;
  agentId: string;
  sessionId?: string;
  persona?: string;
  limit?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Message Formatter
 *
 * Provides utilities for validating and formatting user messages
 */
export class MessageFormatter {
  // Configuration constants
  private static readonly MAX_MESSAGE_LENGTH = 10000;
  private static readonly MIN_MESSAGE_LENGTH = 1;

  /**
   * Validates user message input
   *
   * @param input - User message input to validate
   * @returns Validation result with error message if invalid
   */
  static validateMessage(input: UserMessageInput): ValidationResult {
    // Check if text is provided
    if (!input.text) {
      return {
        valid: false,
        error: 'Message text is required',
      };
    }

    // Check if text is a string
    if (typeof input.text !== 'string') {
      return {
        valid: false,
        error: 'Message text must be a string',
      };
    }

    // Trim and check length
    const trimmedText = input.text.trim();

    if (trimmedText.length < this.MIN_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: 'Message cannot be empty',
      };
    }

    if (trimmedText.length > this.MAX_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Message exceeds maximum length of ${this.MAX_MESSAGE_LENGTH} characters`,
      };
    }

    // Validate images if provided
    if (input.images) {
      if (!Array.isArray(input.images)) {
        return {
          valid: false,
          error: 'Images must be an array',
        };
      }

      // Check each image is a valid string (URL or base64)
      for (const image of input.images) {
        if (typeof image !== 'string' || image.trim().length === 0) {
          return {
            valid: false,
            error: 'All images must be valid non-empty strings',
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validates session metadata
   *
   * @param metadata - Session metadata to validate
   * @returns Validation result with error message if invalid
   */
  static validateSessionMetadata(metadata: SessionMetadata): ValidationResult {
    // Check required fields
    if (!metadata.userId || typeof metadata.userId !== 'string') {
      return {
        valid: false,
        error: 'User ID is required and must be a string',
      };
    }

    if (!metadata.agentId || typeof metadata.agentId !== 'string') {
      return {
        valid: false,
        error: 'Agent ID is required and must be a string',
      };
    }

    // sessionId is optional but if provided must be a string
    if (metadata.sessionId !== undefined && 
        metadata.sessionId !== null && 
        typeof metadata.sessionId !== 'string') {
      return {
        valid: false,
        error: 'Session ID must be a string if provided',
      };
    }

    return { valid: true };
  }

  /**
   * Formats a user message into a protocol-compliant chat message
   *
   * @param input - User message input
   * @param metadata - Session metadata
   * @returns Formatted chat message ready for transmission
   * @throws Error if validation fails
   */
  static formatMessage(
    input: UserMessageInput,
    metadata: SessionMetadata,
  ): ChatMessage {
    // Validate input
    const inputValidation = this.validateMessage(input);
    if (!inputValidation.valid) {
      throw new Error(`Invalid message input: ${inputValidation.error}`);
    }

    // Validate metadata
    const metadataValidation = this.validateSessionMetadata(metadata);
    if (!metadataValidation.valid) {
      throw new Error(`Invalid session metadata: ${metadataValidation.error}`);
    }

    // Create chat context
    const context: ChatContext = {
      agentId: metadata.agentId,
      userId: metadata.userId,
      conversationId: metadata.sessionId,
      persona: metadata.persona,
      images: input.images,
      limit: metadata.limit,
      metadata: metadata.metadata,
    };

    // Use adapter to create properly formatted message
    return desktopMateAdapter.createChatMessage(input.text.trim(), context);
  }

  /**
   * Convenience method that validates and formats in one call
   *
   * @param input - User message input
   * @param metadata - Session metadata
   * @returns Object containing validation result and formatted message (if valid)
   */
  static validateAndFormat(
    input: UserMessageInput,
    metadata: SessionMetadata,
  ): {
    valid: boolean;
    error?: string;
    message?: ChatMessage;
  } {
    // Validate input
    const inputValidation = this.validateMessage(input);
    if (!inputValidation.valid) {
      return {
        valid: false,
        error: inputValidation.error,
      };
    }

    // Validate metadata
    const metadataValidation = this.validateSessionMetadata(metadata);
    if (!metadataValidation.valid) {
      return {
        valid: false,
        error: metadataValidation.error,
      };
    }

    // Format message
    try {
      const message = this.formatMessage(input, metadata);
      return {
        valid: true,
        message,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown formatting error',
      };
    }
  }
}

// Export singleton instance methods as convenience functions
export const validateMessage = MessageFormatter.validateMessage.bind(MessageFormatter);
export const validateSessionMetadata = MessageFormatter.validateSessionMetadata.bind(MessageFormatter);
export const formatMessage = MessageFormatter.formatMessage.bind(MessageFormatter);
export const validateAndFormat = MessageFormatter.validateAndFormat.bind(MessageFormatter);
