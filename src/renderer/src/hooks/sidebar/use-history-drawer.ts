import { useState } from "react";
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
    messages,
  } = useChatHistory();

  const fetchAndSetHistory = (sessionId: string) => {
    if (!sessionId || sessionId === currentSessionId) return;
    
    // Simply select the session - the context will handle loading messages
    selectSession(sessionId);
  };

  const deleteHistory = async (sessionId: string) => {
    if (sessionId === currentSessionId) {
      toaster.create({
        title: t("error.cannotDeleteCurrentHistory"),
        type: "warning",
        duration: 2000,
      });
      return;
    }

    try {
      await deleteSession(sessionId, {
        user_id: localStorage.getItem("user_id") || "default-user",
        agent_id: localStorage.getItem("agent_id") || "default-agent",
      });
      
      toaster.create({
        title: t("success.historyDeleted"),
        type: "success",
        duration: 2000,
      });
      
      // Reload the session list
      // The context should handle this automatically on next render
    } catch (error) {
      console.error("Failed to delete session:", error);
      toaster.create({
        title: t("error.failedToDeleteHistory"),
        type: "error",
        duration: 2000,
      });
    }
  };

  const getLatestMessageContent = (session: Session) => {
    // If this is the current session, use the latest message from context
    if (session.session_id === currentSessionId && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      return {
        content: latestMessage.content,
        timestamp: latestMessage.timestamp,
      };
    }
    
    // Otherwise, return session metadata
    return {
      content: session.metadata?.title || "",
      timestamp: session.metadata?.created_at || null,
    };
  };

  return {
    open,
    setOpen,
    historyList,
    currentSessionId,
    fetchAndSetHistory,
    deleteHistory,
    getLatestMessageContent,
  };
};
