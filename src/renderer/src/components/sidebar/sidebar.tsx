import { Box, Button, useDisclosure } from '@chakra-ui/react'
import { FiSettings, FiClock, FiPlus, FiChevronLeft } from 'react-icons/fi'
import { sidebarStyles } from './sidebar-styles'
import SettingUI from './setting/setting-ui'
import ChatHistoryPanel from './chat-history-panel'
import CameraPanel from './camera-panel'
import { useInterrupt } from '../canvas/live2d'
import HistoryDrawer from './history-drawer'
import { useChatHistory } from '@/context/chat-history-context'
import { useWebSocket } from '@/context/websocket-context'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle: () => void
}

function Sidebar({ isCollapsed = false, onToggle }: SidebarProps): JSX.Element {
  const { open, onOpen, onClose } = useDisclosure()
  const { sendMessage } = useWebSocket()
  const { interrupt } = useInterrupt()
  const { currentHistoryUid, messages, updateHistoryList } = useChatHistory()

  const createNewHistory = (): void => {
    if (currentHistoryUid && messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      updateHistoryList(currentHistoryUid, latestMessage)
    }

    interrupt()
    sendMessage({
      type: 'create-new-history'
    })
  }

  return (
    <Box {...sidebarStyles.sidebar.container(isCollapsed)}>
      <Box
        {...sidebarStyles.sidebar.toggleButton}
        style={{
          transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
        }}
        onClick={onToggle}
      >
        <FiChevronLeft />
      </Box>

      {!isCollapsed && !open && (
        <Box {...sidebarStyles.sidebar.content}>
          <Box {...sidebarStyles.sidebar.header}>
            <Box display="flex" gap={1}>
              <Button onClick={onOpen}>
                <FiSettings />
              </Button>

              <HistoryDrawer>
                <Button>
                  <FiClock />
                </Button>
              </HistoryDrawer>

              <Button onClick={createNewHistory}>
                <FiPlus />
              </Button>
            </Box>
          </Box>

          <ChatHistoryPanel />
          <CameraPanel />
        </Box>
      )}

      {!isCollapsed && open && <SettingUI open={open} onClose={onClose} onToggle={onToggle} />}
    </Box>
  )
}

export default Sidebar
