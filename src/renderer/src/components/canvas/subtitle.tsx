import { Box, Text } from '@chakra-ui/react'
import { canvasStyles } from './canvas-styles'
import { useSubtitleDisplay } from '@/hooks/canvas/use-subtitle-display'
import { memo } from 'react'

// Type definitions
interface SubtitleTextProps {
  text: string
}

// Reusable components
const SubtitleText = memo(({ text }: SubtitleTextProps) => (
  <Text {...canvasStyles.subtitle.text}>
    {text}
  </Text>
))

SubtitleText.displayName = 'SubtitleText'

// Main component
const Subtitle = memo((): JSX.Element | null => {
  const { subtitleText, isLoaded } = useSubtitleDisplay()

  if (!isLoaded || !subtitleText) return null

  return (
    <Box {...canvasStyles.subtitle.container}>
      <SubtitleText text={subtitleText} />
    </Box>
  )
})

Subtitle.displayName = 'Subtitle'

export default Subtitle
