/**
 * Hook for managing session drawer state and operations
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/context/session-context';
import { useSessionManager } from '@/hooks/utils/use-session-manager';
import { toaster } from '@/components/ui/toaster';

interface DeleteDialogState {
  isOpen: boolean;
  sessionId: string | null;
}

export const useSessionDrawer = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({
    isOpen: false,
    sessionId: null,
  });

  // Get session context
  const { userId, agentId, sessionId: currentSessionId, setSessionId } = useSession();

  // Initialize session manager with auto-load enabled
  const sessionManager = useSessionManager({
    userId,
    agentId,
    autoLoadSessions: true,
    autoLoadHistory: false,
  });

  const {
    sessions,
    isLoading,
    error,
    loadHistory,
    createSession,
    deleteSession: deleteSessionApi,
    listSessions,
  } = sessionManager;

  // Refresh sessions when drawer opens
  useEffect(() => {
    if (open && userId && agentId) {
      listSessions().catch((err) => {
        toaster.create({
          title: t('session.loadError'),
          description: err.message,
          type: 'error',
          duration: 3000,
        });
      });
    }
  }, [open, userId, agentId, listSessions, t]);

  /**
   * Load a session and set it as current
   */
  const loadSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === currentSessionId) {
        // Already selected
        return;
      }

      try {
        await loadHistory(sessionId);
        setSessionId(sessionId);
        
        toaster.create({
          title: t('session.loaded'),
          description: t('session.loadedDescription', { sessionId }),
          type: 'success',
          duration: 2000,
        });
      } catch (err) {
        toaster.create({
          title: t('session.loadError'),
          description: (err as Error).message,
          type: 'error',
          duration: 3000,
        });
      }
    },
    [currentSessionId, loadHistory, setSessionId, t],
  );

  /**
   * Create a new session
   */
  const createNewSession = useCallback(async () => {
    try {
      const newSessionId = await createSession();
      setSessionId(newSessionId);
      
      toaster.create({
        title: t('session.created'),
        description: t('session.createdDescription', { sessionId: newSessionId }),
        type: 'success',
        duration: 2000,
      });

      // Refresh session list
      await listSessions();
    } catch (err) {
      toaster.create({
        title: t('session.createError'),
        description: (err as Error).message,
        type: 'error',
        duration: 3000,
      });
    }
  }, [createSession, setSessionId, listSessions, t]);

  /**
   * Open delete confirmation dialog
   */
  const openDeleteDialog = useCallback((sessionId: string) => {
    setDeleteDialogState({
      isOpen: true,
      sessionId,
    });
  }, []);

  /**
   * Close delete confirmation dialog
   */
  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogState({
      isOpen: false,
      sessionId: null,
    });
  }, []);

  /**
   * Confirm and execute session deletion
   */
  const confirmDelete = useCallback(async () => {
    const { sessionId } = deleteDialogState;
    
    if (!sessionId) {
      return;
    }

    // Prevent deleting current session
    if (sessionId === currentSessionId) {
      toaster.create({
        title: t('session.deleteCurrentError'),
        description: t('session.deleteCurrentErrorDescription'),
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      await deleteSessionApi(sessionId);
      
      toaster.create({
        title: t('session.deleted'),
        description: t('session.deletedDescription', { sessionId }),
        type: 'success',
        duration: 2000,
      });

      // Refresh session list
      await listSessions();
    } catch (err) {
      toaster.create({
        title: t('session.deleteError'),
        description: (err as Error).message,
        type: 'error',
        duration: 3000,
      });
    }
  }, [deleteDialogState, currentSessionId, deleteSessionApi, listSessions, t]);

  return {
    open,
    setOpen,
    sessions,
    currentSessionId,
    isLoading,
    error,
    loadSession,
    createNewSession,
    deleteSession: deleteSessionApi,
    deleteDialogState,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  };
};
