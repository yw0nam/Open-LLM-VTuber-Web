import { Box, Text } from '@chakra-ui/react'
import ChatBubble from './chat-bubble'
import { sidebarStyles } from './sidebar-styles'
import { useChatHistoryPanel } from '@/hooks/sidebar/use-chat-history-panel'
import { memo } from 'react'
import { Message } from '@/types/message'

// Type definitions
interface MessageListProps {
  messages: Message[]
  messageListRef: React.RefObject<HTMLDivElement>
}

interface EmptyStateProps {
  message: string
}

// Reusable components
const EmptyState = ({ message }: EmptyStateProps): JSX.Element => (
  <Box
    height="100%"
    display="flex"
    alignItems="center"
    justifyContent="center"
    color="whiteAlpha.500"
  >
    <Text fontSize="sm">{message}</Text>
  </Box>
)

// Memoized message list component for better performance
const MessageList = memo(({ messages, messageListRef }: MessageListProps): JSX.Element => (
  <Box {...sidebarStyles.chatHistoryPanel.messageList} ref={messageListRef}>
    {messages.map((message) => (
      <ChatBubble
        key={`${message.role}-${message.timestamp}-${message.id}`}
        message={message}
      />
    ))}
  </Box>
))

MessageList.displayName = 'MessageList'

// Main component
function ChatHistoryPanel(): JSX.Element {
  const { messages, messageListRef } = useChatHistoryPanel()

  return (
    <Box {...sidebarStyles.chatHistoryPanel.container}>
      <Text {...sidebarStyles.chatHistoryPanel.title}>Chat History</Text>
      {messages.length === 0 ? (
        <EmptyState message="No messages yet. Start a conversation!" />
      ) : (
        <MessageList messages={messages} messageListRef={messageListRef} />
      )}
    </Box>
  )
}

export default ChatHistoryPanel
