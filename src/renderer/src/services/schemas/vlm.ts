import { z } from 'zod'

// ============================================================================
// VLM Analyze Request Schema
// ============================================================================

// Note: For multipart/form-data, the actual request will be constructed
// using FormData in the API service. This schema represents the data structure.
export const VLMAnalyzeRequestSchema = z.object({
  image: z.instanceof(File).or(z.instanceof(Blob)),
  prompt: z.string().optional()
})

export type VLMAnalyzeRequest = z.infer<typeof VLMAnalyzeRequestSchema>

// ============================================================================
// VLM Analyze Response Schema
// ============================================================================

export const VLMAnalyzeResponseSchema = z.object({
  analysis: z.string()
})

export type VLMAnalyzeResponse = z.infer<typeof VLMAnalyzeResponseSchema>
