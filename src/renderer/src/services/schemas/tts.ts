import { z } from 'zod'

// ============================================================================
// TTS Synthesize Request Schema
// ============================================================================

export const TTSSynthesizeRequestSchema = z.object({
  text: z.string().min(1, 'Text must be at least 1 character long'),
  reference_id: z.string().optional(),
  output_format: z.enum(['bytes', 'base64']).default('base64')
})

export type TTSSynthesizeRequest = z.infer<typeof TTSSynthesizeRequestSchema>

// ============================================================================
// TTS Synthesize Response Schema
// ============================================================================

export const TTSSynthesizeResponseSchema = z.object({
  audio_data: z.string(),
  format: z.enum(['bytes', 'base64'])
})

export type TTSSynthesizeResponse = z.infer<typeof TTSSynthesizeResponseSchema>
