import { useBgUrl } from '@/context/bgurl-context'
import { useMemo } from 'react'

export const useBackground = () => {
  const context = useBgUrl()

  const backgroundUrl = useMemo(() => {
    if (!context) return null
    return context.backgroundUrl
  }, [context?.backgroundUrl])

  return {
    backgroundUrl,
    isLoaded: !!context
  }
} 