import { createContext, useState, useMemo, useContext, memo } from 'react'

// Type definitions
interface SubtitleContextState {
  subtitleText: string
  setSubtitleText: (text: string) => void
}

// Default values
const DEFAULT_SUBTITLE = "Hi, I'm some random AI VTuber. Who the hell are ya? Ahh, you must be amazed by my awesomeness, right? right?"

// Context
export const SubtitleContext = createContext<SubtitleContextState | null>(null)

// Provider component
export const SubtitleProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [subtitleText, setSubtitleText] = useState<string>(DEFAULT_SUBTITLE)

  const value = useMemo(() => ({
    subtitleText,
    setSubtitleText,
  }), [subtitleText])

  return (
    <SubtitleContext.Provider value={value}>
      {children}
    </SubtitleContext.Provider>
  )
})

SubtitleProvider.displayName = 'SubtitleProvider'

// Hook
export const useSubtitle = () => {
  const context = useContext(SubtitleContext)
  if (!context) {
    throw new Error('useSubtitle must be used within a SubtitleProvider')
  }
  return context
}
