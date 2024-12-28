import { Box, Button } from '@chakra-ui/react';
import { FiTrash2 } from "react-icons/fi";
import { formatDistanceToNow } from 'date-fns';
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
} from "@/components/ui/drawer";
import { sidebarStyles } from './sidebar-styles';
import { useChatHistory } from '@/context/chat-history-context';
import { useState } from 'react';
import { HistoryInfo } from '@/context/websocket-context';
import { useWebSocket } from '@/context/websocket-context';

interface HistoryDrawerProps {
  children: React.ReactNode;
}

function HistoryDrawer({ children }: HistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const {
    historyList,
    currentHistoryUid,
    setCurrentHistoryUid,
    setHistoryList,
    messages,
    updateHistoryList
  } = useChatHistory();
  const { sendMessage } = useWebSocket();

  const fetchAndSetHistory = (uid: string) => {
    if (!uid || uid === currentHistoryUid) return;

    if (currentHistoryUid && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      updateHistoryList(currentHistoryUid, latestMessage);
    }

    setCurrentHistoryUid(uid);
    sendMessage({
      type: 'fetch-and-set-history',
      history_uid: uid,
    });
  };

  const deleteHistory = (uid: string) => {
    sendMessage({
      type: 'delete-history',
      history_uid: uid,
    });
    setHistoryList(historyList.filter(history => history.uid !== uid));
  };

  const getLatestMessageContent = (history: HistoryInfo) => {
    if (history.uid === currentHistoryUid && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      return {
        content: latestMessage.content,
        timestamp: latestMessage.timestamp
      };
    }
    return {
      content: history.latest_message?.content || '',
      timestamp: history.timestamp
    };
  };

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="start"
    >
      <DrawerBackdrop />
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent style={sidebarStyles.historyDrawer.drawer.content}>
        <DrawerHeader>
          <DrawerTitle style={sidebarStyles.historyDrawer.drawer.title}>Chat History List</DrawerTitle>
          <DrawerCloseTrigger style={sidebarStyles.historyDrawer.drawer.closeButton} />
        </DrawerHeader>

        <DrawerBody>
          <Box {...sidebarStyles.historyDrawer.listContainer}>
            {historyList.map((history: HistoryInfo) => {
              const latestMessage = getLatestMessageContent(history);

              return (
                <Box
                  key={history.uid}
                  {...sidebarStyles.historyDrawer.historyItem}
                  {...(currentHistoryUid === history.uid
                    ? sidebarStyles.historyDrawer.historyItemSelected
                    : {}
                  )}
                  onClick={() => fetchAndSetHistory(history.uid)}
                >
                  <Box {...sidebarStyles.historyDrawer.historyHeader}>
                    <Box {...sidebarStyles.historyDrawer.timestamp}>
                      {latestMessage.timestamp
                        ? formatDistanceToNow(new Date(latestMessage.timestamp), { addSuffix: true })
                        : 'No messages'}
                    </Box>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistory(history.uid);
                      }}
                      {...sidebarStyles.historyDrawer.deleteButton}
                    >
                      <FiTrash2 />
                    </Button>
                  </Box>
                  {latestMessage.content && (
                    <Box {...sidebarStyles.historyDrawer.messagePreview}>
                      {latestMessage.content}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </DrawerBody>

        <DrawerFooter>
          <DrawerActionTrigger asChild>
            <Button {...sidebarStyles.historyDrawer.drawer.actionButton}>
              Close
            </Button>
          </DrawerActionTrigger>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default HistoryDrawer;
