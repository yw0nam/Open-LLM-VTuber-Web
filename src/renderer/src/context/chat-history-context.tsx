import React, { createContext, useContext, useState } from 'react';
import { Message } from '@/types/message';
import { HistoryInfo } from './websocket-context';

interface ChatHistoryContextProps {
  messages: Message[];
  historyList: HistoryInfo[];
  currentHistoryUid: string | null;
  appendHumanMessage: (content: string) => void;
  appendAIMessage: (content: string) => void;
  setMessages: (messages: Message[]) => void;
  setHistoryList: (value: HistoryInfo[] | ((prev: HistoryInfo[]) => HistoryInfo[])) => void;
  setCurrentHistoryUid: (uid: string | null) => void;
  updateHistoryList: (uid: string, latestMessage: Message | null) => void;
}

export const ChatHistoryContext = createContext<ChatHistoryContextProps | null>(null);

export function ChatHistoryProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyList, setHistoryList] = useState<HistoryInfo[]>([]);
  const [currentHistoryUid, setCurrentHistoryUid] = useState<string | null>(null);

  const appendHumanMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'human',
      timestamp: new Date().toISOString(),
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
  };

  const appendAIMessage = (content: string) => {
    setMessages(prevMessages => {
      const lastMessage = prevMessages[prevMessages.length - 1];

      if (lastMessage && lastMessage.role === 'ai') {
        const updatedMessage = {
          ...lastMessage,
          content: lastMessage.content + content,
        };
        const updatedMessages = [...prevMessages];
        updatedMessages[updatedMessages.length - 1] = updatedMessage;
        return updatedMessages;
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        role: 'ai',
        timestamp: new Date().toISOString(),
      };
      return [...prevMessages, newMessage];
    });
  };

  const updateHistoryList = (uid: string, latestMessage: Message | null) => {
    if (!uid) console.error('updateHistoryList: uid is null');
    if (!currentHistoryUid) console.error('updateHistoryList: currentHistoryUid is null');
    setHistoryList(prevList => {
      return prevList.map(history => {
        if (history.uid === uid) {
          return {
            ...history,
            latest_message: latestMessage ? {
              content: latestMessage.content,
              role: latestMessage.role,
              timestamp: latestMessage.timestamp
            } : null,
            timestamp: latestMessage?.timestamp || history.timestamp
          };
        }
        return history;
      });
    });
  };

  return (
    <ChatHistoryContext.Provider
      value={{
        messages,
        historyList,
        currentHistoryUid,
        appendHumanMessage,
        appendAIMessage,
        setMessages,
        setHistoryList,
        setCurrentHistoryUid,
        updateHistoryList,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
}

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};
