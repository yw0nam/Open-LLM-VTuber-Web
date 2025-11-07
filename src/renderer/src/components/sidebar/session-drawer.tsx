import { Box, Button, Text } from '@chakra-ui/react';
import { FiTrash2, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DrawerRoot,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerCloseTrigger,
} from '@/components/ui/drawer';
import { DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger } from '@/components/ui/dialog';
import { sidebarStyles } from './sidebar-styles';
import { useSessionDrawer } from '@/hooks/sidebar/use-session-drawer';
import type { SessionMetadata } from '@/services/config-types';

// Type definitions
interface SessionDrawerProps {
  children: React.ReactNode;
}

interface SessionItemProps {
  session: SessionMetadata;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleteDisabled: boolean;
}

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionId: string;
}

// Delete confirmation dialog
const DeleteConfirmDialog = memo(({
  isOpen,
  onClose,
  onConfirm,
  sessionId,
}: DeleteConfirmDialogProps) => {
  const { t } = useTranslation();

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('session.confirmDelete')}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <Text>
            {t('session.confirmDeleteMessage', { sessionId })}
          </Text>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </DialogActionTrigger>
          <Button
            colorScheme="red"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
});

DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';

// Session list item component
const SessionItem = memo(({
  session,
  isSelected,
  onSelect,
  onDelete,
  isDeleteDisabled,
}: SessionItemProps): JSX.Element => {
  const { t } = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return t('session.invalidDate');
    }
  };

  return (
    <Box
      p={3}
      mb={2}
      borderRadius="md"
      bg={isSelected ? 'blue.500' : 'whiteAlpha.100'}
      _hover={{ bg: isSelected ? 'blue.600' : 'whiteAlpha.200' }}
      cursor="pointer"
      transition="all 0.2s"
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={t('session.selectSession', { sessionId: session.session_id })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box flex="1" minW="0">
          <Box display="flex" alignItems="center" gap={2} mb={1}>
            <FiMessageSquare size={14} />
            <Text fontSize="sm" fontWeight="semibold" color={isSelected ? 'white' : 'blue.300'} truncate>
              {session.session_id}
            </Text>
          </Box>
          <Text fontSize="xs" color={isSelected ? 'whiteAlpha.900' : 'whiteAlpha.600'}>
            {t('session.createdAt')}: {formatDate(session.created_at)}
          </Text>
          <Text fontSize="xs" color={isSelected ? 'whiteAlpha.900' : 'whiteAlpha.600'}>
            {t('session.updatedAt')}: {formatDate(session.updated_at)}
          </Text>
          {session.metadata?.message_count !== undefined && typeof session.metadata.message_count === 'number' && (
            <Text fontSize="xs" color={isSelected ? 'whiteAlpha.900' : 'whiteAlpha.600'}>
              {t('session.messageCount', { count: session.metadata.message_count })}
            </Text>
          )}
        </Box>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={onDelete}
          disabled={isDeleteDisabled}
          aria-label={t('session.deleteSession')}
          _hover={{ bg: 'red.600' }}
        >
          <FiTrash2 />
        </Button>
      </Box>
    </Box>
  );
});

SessionItem.displayName = 'SessionItem';

// Main drawer component
function SessionDrawer({ children }: SessionDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const {
    open,
    setOpen,
    sessions,
    currentSessionId,
    isLoading,
    error,
    loadSession,
    createNewSession,
    deleteDialogState,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useSessionDrawer();

  return (
    <>
      <DrawerRoot
        open={open}
        onOpenChange={(e) => setOpen(e.open)}
        placement="start"
        size="md"
      >
        <DrawerBackdrop />
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent style={{ ...sidebarStyles.historyDrawer.drawer.content }}>
          <DrawerHeader>
            <DrawerTitle style={sidebarStyles.historyDrawer.drawer.title}>
              {t('session.sessionList')}
            </DrawerTitle>
            <DrawerCloseTrigger style={sidebarStyles.historyDrawer.drawer.closeButton} />
          </DrawerHeader>

          <DrawerBody>
            {error && (
              <Box
                p={3}
                mb={3}
                bg="red.500"
                borderRadius="md"
                color="white"
                fontSize="sm"
              >
                {t('session.error')}: {error.message}
              </Box>
            )}

            {isLoading && (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                p={8}
              >
                <Text color="whiteAlpha.600">{t('session.loading')}</Text>
              </Box>
            )}

            {!isLoading && sessions.length === 0 && (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                p={8}
                gap={2}
              >
                <FiMessageSquare size={32} color="var(--chakra-colors-whiteAlpha-600)" />
                <Text color="whiteAlpha.600" textAlign="center">
                  {t('session.noSessions')}
                </Text>
              </Box>
            )}

            {!isLoading && sessions.length > 0 && (
              <Box overflowY="auto" maxH="calc(100vh - 250px)">
                {sessions.map((session: SessionMetadata) => (
                  <SessionItem
                    key={session.session_id}
                    session={session}
                    isSelected={currentSessionId === session.session_id}
                    onSelect={() => loadSession(session.session_id)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(session.session_id);
                    }}
                    isDeleteDisabled={currentSessionId === session.session_id}
                  />
                ))}
              </Box>
            )}
          </DrawerBody>

          <DrawerFooter gap={2}>
            <Button
              onClick={createNewSession}
              colorScheme="blue"
              disabled={isLoading}
            >
              <FiPlus />
              {t('session.createNew')}
            </Button>
            <DrawerActionTrigger asChild>
              <Button variant="outline">
                {t('common.close')}
              </Button>
            </DrawerActionTrigger>
          </DrawerFooter>
        </DrawerContent>
      </DrawerRoot>

      <DeleteConfirmDialog
        isOpen={deleteDialogState.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDelete}
        sessionId={deleteDialogState.sessionId || ''}
      />
    </>
  );
}

export default SessionDrawer;
