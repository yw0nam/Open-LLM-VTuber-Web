/**
 * Vision and Language Model (VLM) API Service
 * Handles image analysis
 */

import { postFormData } from "./core";
import {
  VLMAnalyzeRequestSchema,
  type VLMAnalyzeRequest,
  VLMAnalyzeResponseSchema,
  type VLMAnalyzeResponse,
} from "../schemas/vlm";

// ============================================================================
// API Methods
// ============================================================================

/**
 * Analyze an image using the Vision and Language Model
 *
 * POST /vlm/analyze
 *
 * @param request - Image file and optional prompt
 * @returns Analysis text
 *
 * @example
 * ```typescript
 * // Basic image analysis
 * const result = await analyzeImage({
 *   image: imageFile,
 *   prompt: 'What do you see in this image?'
 * })
 *
 * // General description without prompt
 * const result = await analyzeImage({
 *   image: imageFile
 * })
 * ```
 */
export async function analyzeImage(
  request: VLMAnalyzeRequest,
): Promise<VLMAnalyzeResponse> {
  // Validate request
  const validatedRequest = VLMAnalyzeRequestSchema.parse(request);

  // Create FormData for multipart/form-data request
  const formData = new FormData();
  formData.append("image", validatedRequest.image);

  if (validatedRequest.prompt) {
    formData.append("prompt", validatedRequest.prompt);
  }

  return postFormData(
    "/vlm/analyze",
    formData,
    undefined,
    VLMAnalyzeResponseSchema,
  );
}
