import { useSubtitle } from '@/context/subtitle-context'
import { useMemo } from 'react'

export const useSubtitleDisplay = () => {
  const context = useSubtitle()

  const subtitleText = useMemo(() => {
    if (!context) return null
    return context.subtitleText
  }, [context?.subtitleText])

  return {
    subtitleText,
    isLoaded: !!context
  }
} 