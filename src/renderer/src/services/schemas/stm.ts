import { z } from "zod";

// ============================================================================
// Session Metadata Schema
// ============================================================================

export const SessionMetadataSchema = z.object({
  user_id: z.string().optional(),
  created_at: z.string().optional(),
  title: z.string().optional(),
});

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>;

// ============================================================================
// Session Schema
// ============================================================================

export const SessionSchema = z.object({
  session_id: z.string().uuid(),
  metadata: SessionMetadataSchema,
});

export type Session = z.infer<typeof SessionSchema>;

// ============================================================================
// List Sessions Response Schema
// ============================================================================

export const ListSessionsResponseSchema = z.array(SessionSchema);

export type ListSessionsResponse = z.infer<typeof ListSessionsResponseSchema>;

// ============================================================================
// Tool Call Schema (OpenAI-compatible)
// ============================================================================

export const ToolCallFunctionSchema = z.object({
  name: z.string(),
  arguments: z.string(), // JSON string
});

export const ToolCallSchema = z.object({
  type: z.literal("function"),
  id: z.string(),
  function: ToolCallFunctionSchema,
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

// ============================================================================
// Chat Message Schema (OpenAI-compatible)
// ============================================================================

// Base message schema
const BaseMessageSchema = z.object({
  timestamp: z.string().optional(),
});

// User message
const UserMessageSchema = BaseMessageSchema.extend({
  role: z.literal("user"),
  content: z.string(),
});

// System message
const SystemMessageSchema = BaseMessageSchema.extend({
  role: z.literal("system"),
  content: z.string(),
});

// Assistant message (with optional tool_calls)
const AssistantMessageSchema = BaseMessageSchema.extend({
  role: z.literal("assistant"),
  content: z.string(),
  tool_calls: z.array(ToolCallSchema).optional(),
});

// Tool message
const ToolMessageSchema = BaseMessageSchema.extend({
  role: z.literal("tool"),
  content: z.string(),
  name: z.string(),
  tool_call_id: z.string(),
});

// Union of all message types
export const ChatMessageSchema = z.discriminatedUnion("role", [
  UserMessageSchema,
  AssistantMessageSchema,
  SystemMessageSchema,
  ToolMessageSchema,
]);

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ============================================================================
// Chat History Schema
// ============================================================================

export const ChatHistorySchema = z.object({
  session_id: z.string().uuid(),
  messages: z.array(ChatMessageSchema),
});

export type ChatHistory = z.infer<typeof ChatHistorySchema>;

// ============================================================================
// Add Chat History Request Schema
// ============================================================================

// Request message schemas (similar but without timestamp)
const RequestUserMessageSchema = z.object({
  role: z.literal("user"),
  content: z.string(),
});

const RequestSystemMessageSchema = z.object({
  role: z.literal("system"),
  content: z.string(),
});

const RequestAssistantMessageSchema = z.object({
  role: z.literal("assistant"),
  content: z.string(),
  tool_calls: z.array(ToolCallSchema).optional(),
});

const RequestToolMessageSchema = z.object({
  role: z.literal("tool"),
  content: z.string(),
  name: z.string(),
  tool_call_id: z.string(),
});

export const AddChatHistoryRequestSchema = z.object({
  messages: z.array(
    z.discriminatedUnion("role", [
      RequestUserMessageSchema,
      RequestAssistantMessageSchema,
      RequestSystemMessageSchema,
      RequestToolMessageSchema,
    ]),
  ),
});

export type AddChatHistoryRequest = z.infer<typeof AddChatHistoryRequestSchema>;

// ============================================================================
// Add Chat History Response Schema
// ============================================================================

export const AddChatHistoryResponseSchema = z.object({
  session_id: z.string().uuid(),
  message_count: z.number().int(),
});

export type AddChatHistoryResponse = z.infer<
  typeof AddChatHistoryResponseSchema
>;

// ============================================================================
// Update Session Metadata Request Schema
// ============================================================================

export const UpdateSessionMetadataRequestSchema = z.object({
  title: z.string().optional(),
  user_id: z.string().optional(),
});

export type UpdateSessionMetadataRequest = z.infer<
  typeof UpdateSessionMetadataRequestSchema
>;

// ============================================================================
// Update Session Metadata Response Schema
// ============================================================================

export const UpdateSessionMetadataResponseSchema = z.object({
  message: z.string(),
});

export type UpdateSessionMetadataResponse = z.infer<
  typeof UpdateSessionMetadataResponseSchema
>;
