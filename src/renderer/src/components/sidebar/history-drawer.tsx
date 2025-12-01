import { Box, Button, Text } from "@chakra-ui/react";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { memo } from "react";
import { useTranslation } from "react-i18next";
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
import { sidebarStyles } from "./sidebar-styles";
import { useHistoryDrawer } from "@/hooks/sidebar/use-history-drawer";
import type { Session } from "@/services/schemas/stm";

// Type definitions
interface HistoryDrawerProps {
  children: React.ReactNode;
}

interface HistoryItemProps {
  isSelected: boolean;
  title: string;
  preview: string;
  timestamp: string | null;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

// Reusable components
const HistoryItem = memo(
  ({
    isSelected,
    title,
    preview,
    timestamp,
    onSelect,
    onDelete,
  }: HistoryItemProps): JSX.Element => {
    const { t } = useTranslation();
    return (
      <Box
        {...sidebarStyles.historyDrawer.historyItem}
        {...(isSelected ? sidebarStyles.historyDrawer.historyItemSelected : {})}
        onClick={onSelect}
      >
        <Box {...sidebarStyles.historyDrawer.historyHeader}>
          <Text 
            fontWeight="medium" 
            fontSize="sm" 
            color="white"
            noOfLines={1}
            flex={1}
          >
            {title}
          </Text>
          <Button
            onClick={onDelete}
            {...sidebarStyles.historyDrawer.deleteButton}
          >
            <FiTrash2 />
          </Button>
        </Box>
        <Box {...sidebarStyles.historyDrawer.timestamp}>
          {timestamp
            ? formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
              })
            : t("history.noMessages")}
        </Box>
        {preview && (
          <Box {...sidebarStyles.historyDrawer.messagePreview}>
            {preview}
          </Box>
        )}
      </Box>
    );
  },
);

HistoryItem.displayName = "HistoryItem";

// Main component
function HistoryDrawer({ children }: HistoryDrawerProps): JSX.Element {
  const { t } = useTranslation();
  const {
    open,
    setOpen,
    historyList,
    currentSessionId,
    fetchAndSetHistory,
    handleNewChat,
    deleteHistory,
    getSessionDisplayInfo,
  } = useHistoryDrawer();

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
          <DrawerTitle style={sidebarStyles.historyDrawer.drawer.title}>
            {t("history.chatHistoryList")}
          </DrawerTitle>
          <DrawerCloseTrigger
            style={sidebarStyles.historyDrawer.drawer.closeButton}
          />
        </DrawerHeader>

        <DrawerBody>
          {/* New Chat Button */}
          <Box px={4} py={2}>
            <Button
              onClick={handleNewChat}
              width="100%"
              colorScheme="blue"
              variant="outline"
              size="md"
            >
              <FiPlus style={{ marginRight: "8px" }} />
              {t("history.newChat")}
            </Button>
          </Box>

          {/* Session List */}
          <Box {...sidebarStyles.historyDrawer.listContainer}>
            {historyList.length === 0 ? (
              <Box textAlign="center" py={8} color="whiteAlpha.600">
                <Text>{t("history.noSessions")}</Text>
              </Box>
            ) : (
              historyList.map((session: Session) => {
                const displayInfo = getSessionDisplayInfo(session);
                return (
                  <HistoryItem
                    key={session.session_id}
                    isSelected={currentSessionId === session.session_id}
                    title={displayInfo.title}
                    preview={displayInfo.preview}
                    timestamp={displayInfo.timestamp}
                    onSelect={() => fetchAndSetHistory(session.session_id)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      deleteHistory(session.session_id);
                    }}
                  />
                );
              })
            )}
          </Box>
        </DrawerBody>

        <DrawerFooter>
          <DrawerActionTrigger asChild>
            <Button {...sidebarStyles.historyDrawer.drawer.actionButton}>
              {t("common.close")}
            </Button>
          </DrawerActionTrigger>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default HistoryDrawer;
