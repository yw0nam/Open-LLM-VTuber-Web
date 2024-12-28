import { Box, Text } from '@chakra-ui/react'
import ChatBubble from './chat-bubble'
import { sidebarStyles } from './sidebar-styles'
import { useChatHistory } from '@/context/chat-history-context'

function ChatHistoryPanel(): JSX.Element {
  const { messages } = useChatHistory()

  return (
    <Box {...sidebarStyles.chatHistoryPanel.container}>
      <Text {...sidebarStyles.chatHistoryPanel.title}>Chat History</Text>
      <Box {...sidebarStyles.chatHistoryPanel.messageList}>
        {messages.map((message) => (
          <ChatBubble
            key={`${message.role}-${message.timestamp}-${message.id}`}
            message={message}
          />
        ))}
      </Box>
    </Box>
  )
}

export default ChatHistoryPanel
