import { Box, Image } from '@chakra-ui/react'
import { canvasStyles } from './canvas-styles'
import { useBackground } from '@/hooks/use-background'
import { memo } from 'react'

// Type definitions
interface BackgroundProps {
  children?: React.ReactNode
}

interface BackgroundImageProps {
  url: string
}

// Reusable components
const BackgroundImage = memo(({ url }: BackgroundImageProps) => (
  <Image 
    src={url} 
    alt="Background" 
    {...canvasStyles.background.image} 
  />
))

BackgroundImage.displayName = 'BackgroundImage'

// Main component
const Background = memo(({ children }: BackgroundProps): JSX.Element | null => {
  const { backgroundUrl, isLoaded } = useBackground()

  if (!isLoaded) return null

  return (
    <Box {...canvasStyles.background.container}>
      {backgroundUrl && <BackgroundImage url={backgroundUrl} />}
      {children}
    </Box>
  )
})

Background.displayName = 'Background'

export default Background
