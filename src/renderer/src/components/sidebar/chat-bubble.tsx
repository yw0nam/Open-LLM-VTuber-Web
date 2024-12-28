import { Box, Text } from '@chakra-ui/react'
import { Message } from '@/types/message'
import { sidebarStyles } from './sidebar-styles'

interface ChatBubbleProps {
  message: Message
}

function ChatBubble({ message }: ChatBubbleProps): JSX.Element {
  const isAI = message.role === 'ai'

  return (
    <Box {...sidebarStyles.chatBubble.container} justifyContent={isAI ? 'flex-start' : 'flex-end'}>
      <Box {...sidebarStyles.chatBubble.message}>
        <Text {...sidebarStyles.chatBubble.text}>{message.content}</Text>
      </Box>
      <Box
        {...sidebarStyles.chatBubble.dot}
        left={isAI ? '-1' : 'auto'}
        right={!isAI ? '-1' : 'auto'}
      />
    </Box>
  )
}

export default ChatBubble
