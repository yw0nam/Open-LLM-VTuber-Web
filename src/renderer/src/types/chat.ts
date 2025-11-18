// src/renderer/src/types/chat.ts 
// 1. 모든 메시지가 공통으로 가지는 기본 속성
interface BaseMessage {
  id: string; // React 렌더링을 위한 고유 ID (필수)
  content: string;
  timestamp: string;
}

// 2. 역할(role)별로 구체적인 타입 정의
export interface UserMessage extends BaseMessage {
  role: "user";
}

export interface AssistantMessage extends BaseMessage {
  role: "assistant";
  // Assistant 메시지만 tool_calls를 가질 수 있습니다.
  tool_calls?: {
    name: string;
    arguments: object; // 파싱된 JSON 객체
  }[];
}

export interface ToolMessage extends BaseMessage {
  role: "tool";
  // Tool 메시지만 tool_call_id를 가질 수 있습니다.
  tool_call_id: string;
  name?: string; // (참고) name도 tool에만 속할 수 있습니다.
}

export interface SystemMessage extends BaseMessage {
  role: "system";
}

// 3. Message 타입을 모든 구체적인 타입의 '합집합'으로 정의
export type Message =
  | UserMessage
  | AssistantMessage
  | ToolMessage
  | SystemMessage;

export interface HistoryInfo {
  sessionId: string;
  messages: Message[];
}
export interface BackgroundFile {
  name: string;
  url: string;
}
