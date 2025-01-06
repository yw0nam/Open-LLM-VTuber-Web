import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { Message } from "@/types/message";
import { HistoryInfo } from "./websocket-context";

/**
 * Chat history context state interface
 * @interface ChatHistoryState
 */
interface ChatHistoryState {
  messages: Message[];
  historyList: HistoryInfo[];
  currentHistoryUid: string | null;
  appendHumanMessage: (content: string) => void;
  appendAIMessage: (content: string) => void;
  setMessages: (messages: Message[]) => void;
  setHistoryList: (
    value: HistoryInfo[] | ((prev: HistoryInfo[]) => HistoryInfo[])
  ) => void;
  setCurrentHistoryUid: (uid: string | null) => void;
  updateHistoryList: (uid: string, latestMessage: Message | null) => void;
}

/**
 * Default values and constants
 */
const DEFAULT_HISTORY = {
  messages: [] as Message[],
  historyList: [] as HistoryInfo[],
  currentHistoryUid: null as string | null,
};

/**
 * Create the chat history context
 */
export const ChatHistoryContext = createContext<ChatHistoryState | null>(null);

/**
 * Chat History Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function ChatHistoryProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [messages, setMessages] = useState<Message[]>(DEFAULT_HISTORY.messages);
  const [historyList, setHistoryList] = useState<HistoryInfo[]>(
    DEFAULT_HISTORY.historyList
  );
  const [currentHistoryUid, setCurrentHistoryUid] = useState<string | null>(
    DEFAULT_HISTORY.currentHistoryUid
  );

  /**
   * Append a human message to the chat history
   * @param content - Message content
   */
  const appendHumanMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "human",
      timestamp: new Date().toISOString(),
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  }, []);

  /**
   * Append or update an AI message in the chat history
   * @param content - Message content
   */
  const appendAIMessage = useCallback((content: string) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];

      if (lastMessage && lastMessage.role === "ai") {
        // Update existing AI message with new ID to trigger re-render
        const updatedMessage = {
          ...lastMessage,
          content: lastMessage.content + content,
          id: Date.now().toString(),
        };
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] = updatedMessage;
        return updatedMessages;
      }

      // Create new AI message
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        role: "ai",
        timestamp: new Date().toISOString(),
      };
      return [...prevMessages, newMessage];
    });
  }, []);

  /**
   * Update the history list with the latest message
   * @param uid - History unique identifier
   * @param latestMessage - Latest message to update with
   */
  const updateHistoryList = useCallback(
    (uid: string, latestMessage: Message | null) => {
      if (!uid) {
        console.error("updateHistoryList: uid is null");
      }
      if (!currentHistoryUid) {
        console.error("updateHistoryList: currentHistoryUid is null");
      }

      setHistoryList((prevList) => {
        return prevList.map((history) => {
          if (history.uid === uid) {
            return {
              ...history,
              latest_message: latestMessage
                ? {
                    content: latestMessage.content,
                    role: latestMessage.role,
                    timestamp: latestMessage.timestamp,
                  }
                : null,
              timestamp: latestMessage?.timestamp || history.timestamp,
            };
          }
          return history;
        });
      });
    },
    [currentHistoryUid]
  );

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      messages,
      historyList,
      currentHistoryUid,
      appendHumanMessage,
      appendAIMessage,
      setMessages,
      setHistoryList,
      setCurrentHistoryUid,
      updateHistoryList,
    }),
    [
      messages,
      historyList,
      currentHistoryUid,
      appendHumanMessage,
      appendAIMessage,
      updateHistoryList,
    ]
  );

  return (
    <ChatHistoryContext.Provider value={contextValue}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

/**
 * Custom hook to use the chat history context
 * @throws {Error} If used outside of ChatHistoryProvider
 */
export function useChatHistory() {
  const context = useContext(ChatHistoryContext);

  if (!context) {
    throw new Error("useChatHistory must be used within a ChatHistoryProvider");
  }

  return context;
}
