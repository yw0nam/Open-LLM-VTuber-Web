import { Box, Text } from '@chakra-ui/react'
import { Message } from '@/types/message'
import { sidebarStyles } from './sidebar-styles'

// Type definitions
interface ChatBubbleProps {
  message: Message
}

interface BubbleContentProps {
  content: string
}

interface BubbleIndicatorProps {
  isAI: boolean
}

// Reusable components
const BubbleContent = ({ content }: BubbleContentProps): JSX.Element => (
  <Box {...sidebarStyles.chatBubble.message}>
    <Text {...sidebarStyles.chatBubble.text}>{content}</Text>
  </Box>
)

const BubbleIndicator = ({ isAI }: BubbleIndicatorProps): JSX.Element => (
  <Box
    {...sidebarStyles.chatBubble.dot}
    left={isAI ? '-1' : 'auto'}
    right={!isAI ? '-1' : 'auto'}
  />
)

// Main component
function ChatBubble({ message }: ChatBubbleProps): JSX.Element {
  const isAI = message.role === 'ai'

  return (
    <Box 
      {...sidebarStyles.chatBubble.container} 
      justifyContent={isAI ? 'flex-start' : 'flex-end'}
    >
      <BubbleContent content={message.content} />
      <BubbleIndicator isAI={isAI} />
    </Box>
  )
}

export default ChatBubble
