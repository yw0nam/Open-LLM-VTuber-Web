import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChatHistory } from "@/context/chat-history-context";
import { toaster } from "@/components/ui/toaster";
import { deleteSession } from "@/services/api-service/stm";
import type { Session } from "@/services/schemas/stm";

export const useHistoryDrawer = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  
  const {
    historyList,
    currentSessionId,
    selectSession,
    createNewSession,
    refreshSessions,
    messages,
  } = useChatHistory();

  // Refresh sessions when drawer opens
  useEffect(() => {
    if (open) {
      refreshSessions();
    }
  }, [open, refreshSessions]);

  const fetchAndSetHistory = useCallback((sessionId: string) => {
    if (!sessionId || sessionId === currentSessionId) return;
    
    // Simply select the session - the context will handle loading messages
    selectSession(sessionId);
  }, [currentSessionId, selectSession]);

  const handleNewChat = useCallback(() => {
    createNewSession();
    toaster.create({
      title: t("notification.newConversation"),
      type: "info",
      duration: 2000,
    });
  }, [createNewSession, t]);

  const deleteHistory = useCallback(async (sessionId: string) => {
    const isCurrentSession = sessionId === currentSessionId;
    
    try {
      await deleteSession(sessionId, {
        user_id: localStorage.getItem("user_id") || "default-user",
        agent_id: localStorage.getItem("agent_id") || "default-agent",
      });
      
      toaster.create({
        title: t("notification.historyDeleteSuccess"),
        type: "success",
        duration: 2000,
      });
      
      // Refresh the session list
      await refreshSessions();
      
      // If we deleted the current session, reset to new chat state
      if (isCurrentSession) {
        createNewSession();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toaster.create({
        title: t("notification.historyDeleteFail"),
        type: "error",
        duration: 2000,
      });
    }
  }, [currentSessionId, refreshSessions, createNewSession, t]);

  const getSessionDisplayInfo = useCallback((session: Session) => {
    // Use metadata.title if available, otherwise use truncated session_id
    const metadataTitle = session.metadata?.title as string | undefined;
    const title = metadataTitle || `${session.session_id.substring(0, 8)}...`;
    
    // If this is the current session, use the latest message from context
    if (session.session_id === currentSessionId && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      return {
        title,
        preview: latestMessage.content,
        timestamp: latestMessage.timestamp || session.updated_at || session.created_at || null,
      };
    }
    
    // Otherwise, return session metadata
    return {
      title,
      preview: "",
      timestamp: session.updated_at || session.created_at || null,
    };
  }, [currentSessionId, messages]);

  return {
    open,
    setOpen,
    historyList,
    currentSessionId,
    fetchAndSetHistory,
    handleNewChat,
    deleteHistory,
    getSessionDisplayInfo,
  };
};
