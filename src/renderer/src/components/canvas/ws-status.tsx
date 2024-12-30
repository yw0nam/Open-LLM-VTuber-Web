import { Box } from '@chakra-ui/react'
import { canvasStyles } from './canvas-styles'
import { useWSStatus } from '@/hooks/use-ws-status'
import { memo } from 'react'

// Type definitions
interface StatusContentProps {
  text: string
}

// Reusable components
const StatusContent = memo(({ text }: StatusContentProps) => (
  <>{text}</>
))

StatusContent.displayName = 'StatusContent'

// Main component
const WebSocketStatus = memo((): JSX.Element => {
  const { color, text } = useWSStatus()

  return (
    <Box {...canvasStyles.wsStatus.container} backgroundColor={color}>
      <StatusContent text={text} />
    </Box>
  )
})

WebSocketStatus.displayName = 'WebSocketStatus'

export default WebSocketStatus
