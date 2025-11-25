/**
 * Text-to-Speech (TTS) API Service
 * Handles speech synthesis
 */

import { post } from "./core";
import {
  TTSSynthesizeRequestSchema,
  type TTSSynthesizeRequest,
  TTSSynthesizeResponseSchema,
  type TTSSynthesizeResponse,
} from "../schemas/tts";

// ============================================================================
// API Methods
// ============================================================================

/**
 * Synthesize text into speech
 *
 * POST /tts/synthesize
 *
 * @param request - Text to synthesize and optional parameters
 * @returns Audio data (base64 encoded by default)
 *
 * @example
 * ```typescript
 * const result = await synthesizeSpeech({
 *   text: 'Hello, world!',
 *   output_format: 'base64'
 * })
 *
 * // With voice cloning
 * const result = await synthesizeSpeech({
 *   text: 'Hello in custom voice!',
 *   reference_id: 'voice-id-123',
 *   output_format: 'base64'
 * })
 * ```
 */
export async function synthesizeSpeech(
  request: TTSSynthesizeRequest,
): Promise<TTSSynthesizeResponse> {
  // Validate request body
  const validatedRequest = TTSSynthesizeRequestSchema.parse(request);

  return post(
    "v1/tts/synthesize",
    validatedRequest,
    undefined,
    TTSSynthesizeResponseSchema,
  );
}
