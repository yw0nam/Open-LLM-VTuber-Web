// src/renderer/src/context/chat-history-context.tsx

/* eslint-disable no-else-return */
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { 
  Message, 
  AssistantMessage, 
  ToolMessage 
} from "@/types/chat"; // types/chat.ts에서 Message 임포트
import {
  // stm.ts에서 API 함수들 임포트
  listSessions,
  getChatHistory,
} from "@/services/api-service/stm";
import {
  // stm.ts의 스키마에서 응답 *타입* 임포트
  type Session,
  type ChatHistory,
} from "@/services/schemas/stm";

/**
 * Chat history context state interface
 */
interface ChatHistoryState {
  messages: Message[];
  historyList: Session[]; // Array of sessions
  currentSessionId: string | null; // 'uid'에서 'session_id'로 명칭 변경
  isLoading: boolean;

  // 세션 선택 및 생성
  selectSession: (sessionId: string | null) => void;
  createNewSession: () => void;
  refreshSessions: () => Promise<void>;

  // UI 메시지 업데이트 (optimistic updates)
  addUserMessageToUI: (content: string) => Promise<void>;

  // (기존) 실시간 스트리밍 UI 업데이트용 함수들
  appendAIMessage: (content: string) => void;
  appendToolCallRequest: (toolCalls: { name: string; arguments: object }[]) => void;
  appendToolResult: (toolResultData: {
    tool_call_id: string;
    content: string;
    name: string;
  }) => void;
  setForceNewMessage: (value: boolean) => void;
}

/**
 * Create the chat history context
 */
export const ChatHistoryContext = createContext<ChatHistoryState | null>(null);

/**
 * Provider Props Interface
 */
interface ChatHistoryProviderProps {
  children: React.ReactNode;
}

/**
 * Chat History Provider Component
 */
export function ChatHistoryProvider({
  children,
}: ChatHistoryProviderProps) {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyList, setHistoryList] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [forceNewMessage, setForceNewMessage] = useState<boolean>(false);

  // Settings from localStorage
  const [userId] = useState<string>(() => localStorage.getItem("user_id") || "default-user");
  const [agentId] = useState<string>(() => localStorage.getItem("agent_id") || "default-agent");

  // --- API 연동 로직 (useEffect) ---

  // Reusable function to load/refresh sessions
  const refreshSessions = useCallback(async () => {
    if (!userId || !agentId) return;

    setIsLoading(true);
    try {
      const response = await listSessions({
        user_id: userId,
        agent_id: agentId,
      });
      setHistoryList(response.sessions);
    } catch (error) {
      console.error("Failed to list sessions:", error);
      setHistoryList([]); // 에러 시 초기화
    } finally {
      setIsLoading(false);
    }
  }, [userId, agentId]);

  // Provider 로드 시 (또는 user/agent 변경 시) 세션 목록 불러오기
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  /**
   * (신규) 2. 현재 세션 ID(currentSessionId)가 변경되면 해당 세션의 메시지 불러오기
   */
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]); // 세션이 선택되지 않으면 메시지 비우기
      return;
    }

    if (!userId || !agentId) return;

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const history: ChatHistory = await getChatHistory({
          user_id: userId,
          agent_id: agentId,
          session_id: currentSessionId,
          limit: 100, // (예시) 최근 100개
        });

        setMessages(history.messages);
      } catch (error) {
        console.error("Failed to get chat history:", error);
        setMessages([]); // 에러 시 초기화
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [currentSessionId, userId, agentId]);

  // --- 세션 관리 함수 ---
  const selectSession = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId);
  }, []);
  
  //(신규) 새 채팅 세션 시작 (UI만 초기화)
  const createNewSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);


  // --- UI 메시지 업데이트 함수 ---
  /**
   * Add user message to local UI state (optimistic update).
   * Actual message sending is handled by WebSocket layer.
   * Backend automatically saves to STM on stream_end.
   */
  const addUserMessageToUI = useCallback(
    async (content: string) => {
      const newMessage: Message = {
        id: crypto.randomUUID(), // 프론트엔드 렌더링용 고유 ID
        content,
        role: "user",
        timestamp: new Date().toISOString(),
      };

      // (낙관적 업데이트) UI에 즉시 메시지 추가
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    },
    []
  );

  // Update UI when got websocket event 'stream_token'
  const appendAIMessage = useCallback(
    (content: string) => {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (
          forceNewMessage ||
          !lastMessage ||
          lastMessage.role !== "assistant"
        ) {
          setForceNewMessage(false);
          return [
            ...prevMessages,
            {
              id: Date.now().toString(),
              content,
              role: "assistant",
              timestamp: new Date().toISOString(),
            },
          ];
        }
        return [
          ...prevMessages.slice(0, -1),
          {
            ...lastMessage,
            content: lastMessage.content + content,
            timestamp: new Date().toISOString(),
          },
        ];
      });
    },
    [forceNewMessage, setForceNewMessage],
  );

  /**
   * Update UI when tool_call event is received from WebSocket.
   * Adds or updates tool_calls in the last assistant message.
   */
  const appendToolCallRequest = useCallback(
    (toolCalls: { name: string; arguments: object }[]) => {
      if (!toolCalls || toolCalls.length === 0) return;

    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];

      // 마지막 메시지가 'assistant'가 아니거나 이미 tool call이 있으면 새 메시지로 추가합니다.
      if (
        !lastMessage ||
        lastMessage.role !== "assistant" ||
        lastMessage.tool_calls
      ) {
        // 새 Assistant 메시지 생성 (내용은 비워두거나 기본값 설정)
        const newAssistantMessage: AssistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "", // 또는 "Tool(s) called"
          tool_calls: toolCalls,
          timestamp: new Date().toISOString(),
        };
        return [...prevMessages, newAssistantMessage];
      }

      // 마지막 'assistant' 메시지에 tool_calls 정보 업데이트
      const updatedLastMessage: AssistantMessage = {
        ...lastMessage,
        tool_calls: toolCalls,
        timestamp: new Date().toISOString(), // 타임스탬프 갱신
      };

      return [
        ...prevMessages.slice(0, -1), // 마지막 메시지 제거
        updatedLastMessage, // 수정된 메시지로 교체
      ];
    });
  }, []);

  /**
   * Update UI when tool_result event is received from WebSocket.
   * Adds a new tool message to the conversation.
   */
  const appendToolResult = useCallback(
    (toolResultData: {
      tool_call_id: string;
      content: string;
      name: string;
    }) => {
    // 새 ToolMessage 생성
    const newToolMessage: ToolMessage = {
      id: crypto.randomUUID(), // 프론트엔드 렌더링용 고유 ID
      role: "tool",
      tool_call_id: toolResultData.tool_call_id,
      name: toolResultData.name,
      content: toolResultData.content,
      timestamp: new Date().toISOString(),
    };

      setMessages((prevMessages) => [...prevMessages, newToolMessage]);
    },
    []
  );

  // --- Context Value (Memoized) ---

  const contextValue = useMemo(
    () => ({
      messages,
      historyList,
      currentSessionId,
      isLoading,
      selectSession,
      createNewSession,
      refreshSessions,
      addUserMessageToUI,
      // 스트리밍 UI 업데이트 함수들
      appendAIMessage,
      appendToolCallRequest,
      appendToolResult,
      setForceNewMessage,
    }),
    [
      messages,
      historyList,
      currentSessionId,
      isLoading,
      selectSession,
      createNewSession,
      refreshSessions,
      addUserMessageToUI,
      appendAIMessage,
      appendToolCallRequest,
      appendToolResult,
    ],
  );

  return (
    <ChatHistoryContext.Provider value={contextValue}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

/**
 * Custom hook to use the chat history context
 */
export function useChatHistory() {
  const context = useContext(ChatHistoryContext);

  if (!context) {
    throw new Error("useChatHistory must be used within a ChatHistoryProvider");
  }

  return context;
}