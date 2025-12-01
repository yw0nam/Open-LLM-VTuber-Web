// src/renderer/src/services/schemas/stm.ts
import { z } from "zod";
import {
  type Message,
  type AssistantMessage,
  type SystemMessage,
  type ToolMessage,
} from "@/types/chat";

// ============================================================================
// Session Metadata Schema
// ============================================================================

export const SessionMetadataSchema = z.object({
  user_id: z.string().optional(),
  agent_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SessionMetadata = z.infer<typeof SessionMetadataSchema>;

// ============================================================================
// Session Schema
// ============================================================================

export const SessionSchema = z.object({
  session_id: z.string(),
  user_id: z.string().optional(),
  agent_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Session = z.infer<typeof SessionSchema>;

// ============================================================================
// List Sessions Response Schema
// ============================================================================

// Backend returns { sessions: [...] } not a direct array
export const ListSessionsResponseSchema = z.object({
  sessions: z.array(SessionSchema),
});

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
const BackendUserMessageSchema = BaseMessageSchema.extend({
  role: z.literal("user"),
  content: z.string(),
});

// System message
const BackendSystemMessageSchema = BaseMessageSchema.extend({
  role: z.literal("system"),
  content: z.string(),
});

// Assistant message (with optional tool_calls)
const BackendAssistantMessageSchema = BaseMessageSchema.extend({
  role: z.literal("assistant"),
  content: z.string(),
  tool_calls: z.array(ToolCallSchema).nullable().optional(),
});

// Tool message
const BackendToolMessageSchema = BaseMessageSchema.extend({
  role: z.literal("tool"),
  content: z.string(),
  name: z.string(),
  tool_call_id: z.string(),
});

// Union of all message types
export const BackendChatMessageSchema = z.discriminatedUnion("role", [
  BackendUserMessageSchema,
  BackendAssistantMessageSchema,
  BackendSystemMessageSchema,
  BackendToolMessageSchema,
]);

export type BackendChatMessage = z.infer<typeof BackendChatMessageSchema>;

// 1. Zod가 파싱할 *원본* 스키마
const BaseChatHistorySchema = z.object({
  session_id: z.string().uuid(),
  messages: z.array(BackendChatMessageSchema), // 백엔드 메시지 스키마 사용
});

// .transform()을 사용해 백엔드 타입을 프론트엔드 타입으로 변환
export const ChatHistorySchema = BaseChatHistorySchema.transform(
  (history): { session_id: string; messages: Message[] } => {
    // 여기가 아까 그 "길고 장황한" 변환 로직입니다.
    // 이제 이 로직은 stm.ts 파일 안에 '숨겨집니다'.
    const frontendMessages: Message[] = history.messages.map(
      (msgFromServer: BackendChatMessage): Message => {
        // 공통 속성: id, timestamp, content 보장
        const commonProps = {
          id: crypto.randomUUID(), // 1. 프론트엔드용 ID 생성
          timestamp: msgFromServer.timestamp || new Date().toISOString(), // 2. timestamp 기본값 보장
          content: msgFromServer.content || "", // (혹시 content가 null일 경우 대비)
        };

        switch (msgFromServer.role) {
          case "user":
            return { ...commonProps, role: "user" };

          case "assistant":
            const newAssistantMessage: AssistantMessage = {
              ...commonProps,
              role: "assistant",
            };

            // 3. tool_calls.arguments를 string -> object로 변환
            if (msgFromServer.tool_calls) {
              newAssistantMessage.tool_calls = msgFromServer.tool_calls.map(
                (tc) => {
                  let parsedArgs: object = {};
                  try {
                    parsedArgs = JSON.parse(tc.function.arguments);
                  } catch (e) {
                    parsedArgs = { error: "Failed to parse arguments" };
                  }
                  return { name: tc.function.name, arguments: parsedArgs };
                },
              );
            }
            return newAssistantMessage;

          case "tool":
            return {
              ...commonProps,
              role: "tool",
              tool_call_id: msgFromServer.tool_call_id,
              name: msgFromServer.name,
            } as ToolMessage;

          case "system":
            return { ...commonProps, role: "system" };

          default:
            // Zod의 discriminatedUnion이 이 케이스를 막아주지만,
            // TypeScript의 타입 추론을 위해 명시적으로 처리
            return {
              ...commonProps,
              role: "system",
              content: "[Unknown Role]",
            } as SystemMessage;
        }
      },
    );

    // 변환된 messages를 포함하는 새 객체를 반환
    return {
      session_id: history.session_id,
      messages: frontendMessages, // 덮어쓰기
    };
  },
);

// 3. 'ChatHistory' 타입은 이제 .transform()이 적용된,
// 'messages: Message[]' (프론트엔드 타입)를 가진 타입이 됩니다.
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
