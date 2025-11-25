import { z } from "zod";

// ============================================================================
// Client-to-Server Messages
// ============================================================================

// Authorize Message
export const WSAuthorizeMessageSchema = z.object({
  type: z.literal("authorize"),
  token: z.string(),
});

export type WSAuthorizeMessage = z.infer<typeof WSAuthorizeMessageSchema>;

// Pong Message
export const WSPongMessageSchema = z.object({
  type: z.literal("pong"),
});

export type WSPongMessage = z.infer<typeof WSPongMessageSchema>;

// Chat Message
export const WSChatMessageSchema = z.object({
  type: z.literal("chat_message"),
  content: z.string(),
  agent_id: z.string(),
  user_id: z.string(),
  persona: z.string().optional(),
  images: z.array(z.string()).optional(),
  limit: z.number().int().positive().default(10),
  conversation_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type WSChatMessage = z.infer<typeof WSChatMessageSchema>;

// Interrupt Stream Message
export const WSInterruptStreamMessageSchema = z.object({
  type: z.literal("interrupt_stream"),
  turn_id: z.string().optional(),
});

export type WSInterruptStreamMessage = z.infer<
  typeof WSInterruptStreamMessageSchema
>;

// Fetch Backgrounds Message
export const WSFetchBackgroundsMessageSchema = z.object({
  type: z.literal("fetch_backgrounds"),
});

export type WSFetchBackgroundsMessage = z.infer<
  typeof WSFetchBackgroundsMessageSchema
>;

// Fetch Avatar Configs Message
export const WSFetchAvatarConfigsMessageSchema = z.object({
  type: z.literal("fetch_avatar_configs"),
});

export type WSFetchAvatarConfigsMessage = z.infer<
  typeof WSFetchAvatarConfigsMessageSchema
>;

// Switch Avatar Config Message
export const WSSwitchAvatarConfigMessageSchema = z.object({
  type: z.literal("switch_avatar_config"),
  file: z.string(),
});

export type WSSwitchAvatarConfigMessage = z.infer<
  typeof WSSwitchAvatarConfigMessageSchema
>;

// Union of all client-to-server messages
export const WSClientMessageSchema = z.discriminatedUnion("type", [
  WSAuthorizeMessageSchema,
  WSPongMessageSchema,
  WSChatMessageSchema,
  WSInterruptStreamMessageSchema,
  WSFetchBackgroundsMessageSchema,
  WSFetchAvatarConfigsMessageSchema,
  WSSwitchAvatarConfigMessageSchema,
]);

export type WSClientMessage = z.infer<typeof WSClientMessageSchema>;

// ============================================================================
// Server-to-Client Messages
// ============================================================================

// Authorize Success Message
export const WSAuthorizeSuccessMessageSchema = z.object({
  type: z.literal("authorize_success"),
  connection_id: z.string().uuid(),
});

export type WSAuthorizeSuccessMessage = z.infer<
  typeof WSAuthorizeSuccessMessageSchema
>;

// Authorize Error Message
export const WSAuthorizeErrorMessageSchema = z.object({
  type: z.literal("authorize_error"),
  error: z.string(),
});

export type WSAuthorizeErrorMessage = z.infer<
  typeof WSAuthorizeErrorMessageSchema
>;

// Ping Message
export const WSPingMessageSchema = z.object({
  type: z.literal("ping"),
});

export type WSPingMessage = z.infer<typeof WSPingMessageSchema>;

// Stream Start Message
export const WSStreamStartMessageSchema = z.object({
  type: z.literal("stream_start"),
  turn_id: z.string().uuid(),
  conversation_id: z.string().uuid().nullable(),
  connection_id: z.string().uuid().optional(),
  user_id: z.string().optional(),
});

export type WSStreamStartMessage = z.infer<typeof WSStreamStartMessageSchema>;

// Stream Token Message
export const WSStreamTokenMessageSchema = z.object({
  type: z.literal("stream_token"),
  chunk: z.string(),
  node: z.string().optional(),
  turn_id: z.string().uuid(),
});

export type WSStreamTokenMessage = z.infer<typeof WSStreamTokenMessageSchema>;

// Stream End Message
export const WSStreamEndMessageSchema = z.object({
  type: z.literal("stream_end"),
  turn_id: z.string(),
  conversation_id: z.string().nullable(),
  content: z.string(),
  connection_id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type WSStreamEndMessage = z.infer<typeof WSStreamEndMessageSchema>;

// TTS Ready Chunk Message
export const WSTTSReadyChunkMessageSchema = z.object({
  type: z.literal("tts_ready_chunk"),
  chunk: z.string(),
  emotion: z.string().optional(),
});

export type WSTTSReadyChunkMessage = z.infer<
  typeof WSTTSReadyChunkMessageSchema
>;

// Tool Call Message
export const WSToolCallMessageSchema = z.object({
  type: z.literal("tool_call"),
  tool_name: z.string(),
  args: z.string(), // JSON string containing the arguments
  node: z.string().optional(),
});

export type WSToolCallMessage = z.infer<typeof WSToolCallMessageSchema>;

// Tool Result Message
export const WSToolResultMessageSchema = z.object({
  type: z.literal("tool_result"),
  result: z.string(), // JSON string containing the result
  node: z.string().optional(),
});

export type WSToolResultMessage = z.infer<typeof WSToolResultMessageSchema>;

// Error Message
export const WSErrorMessageSchema = z.object({
  type: z.literal("error"),
  code: z.number().int(),
  error: z.string(),
});

export type WSErrorMessage = z.infer<typeof WSErrorMessageSchema>;

// Background Files Message
export const WSBackgroundFilesMessageSchema = z.object({
  type: z.literal("background_files"),
  files: z.array(z.string()),
});

export type WSBackgroundFilesMessage = z.infer<
  typeof WSBackgroundFilesMessageSchema
>;

// Avatar Config Files Message
export const WSAvatarConfigFilesMessageSchema = z.object({
  type: z.literal("avatar_config_files"),
  configs: z.array(
    z.object({
      filename: z.string(),
      name: z.string(),
    })
  ),
});

export type WSAvatarConfigFilesMessage = z.infer<
  typeof WSAvatarConfigFilesMessageSchema
>;

// Avatar Config Switched Message
export const WSAvatarConfigSwitchedMessageSchema = z.object({
  type: z.literal("avatar_config_switched"),
  file: z.string(),
});

export type WSAvatarConfigSwitchedMessage = z.infer<
  typeof WSAvatarConfigSwitchedMessageSchema
>;

// Set Model And Conf Message
export const WSSetModelAndConfMessageSchema = z.object({
  type: z.literal("set_model_and_conf"),
  model_info: z.record(z.string(), z.unknown()),
  conf_name: z.string(),
  conf_uid: z.string(),
  client_uid: z.string(),
});

export type WSSetModelAndConfMessage = z.infer<
  typeof WSSetModelAndConfMessageSchema
>;

// Union of all server-to-client messages
export const WSServerMessageSchema = z.discriminatedUnion("type", [
  WSAuthorizeSuccessMessageSchema,
  WSAuthorizeErrorMessageSchema,
  WSPingMessageSchema,
  WSStreamStartMessageSchema,
  WSStreamTokenMessageSchema,
  WSStreamEndMessageSchema,
  WSTTSReadyChunkMessageSchema,
  WSToolCallMessageSchema,
  WSToolResultMessageSchema,
  WSErrorMessageSchema,
  WSBackgroundFilesMessageSchema,
  WSAvatarConfigFilesMessageSchema,
  WSAvatarConfigSwitchedMessageSchema,
  WSSetModelAndConfMessageSchema,
]);

export type WSServerMessage = z.infer<typeof WSServerMessageSchema>;
