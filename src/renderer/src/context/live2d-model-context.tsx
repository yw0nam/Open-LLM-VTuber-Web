import { createContext, useContext, useState, memo, useCallback } from 'react'
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch'

interface Live2DModelContextState {
  currentModel: Live2DModel | null
  setCurrentModel: (model: Live2DModel | null) => void
  updateModelState: (updates: Partial<Live2DModel>) => void
}

const Live2DModelContext = createContext<Live2DModelContextState | null>(null)

export const Live2DModelProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [currentModel, setCurrentModel] = useState<Live2DModel | null>(null)

  const updateModelState = useCallback((updates: Partial<Live2DModel>) => {
    setCurrentModel(prev => {
      if (!prev) return null;
      return Object.assign(prev, updates) as Live2DModel;
    });
  }, []);

  return (
    <Live2DModelContext.Provider value={{ 
      currentModel, 
      setCurrentModel,
      updateModelState 
    }}>
      {children}
    </Live2DModelContext.Provider>
  )
})

Live2DModelProvider.displayName = 'Live2DModelProvider'

export const useLive2DModel = () => {
  const context = useContext(Live2DModelContext)
  if (!context) {
    throw new Error('useLive2DModel must be used within a Live2DModelProvider')
  }
  return context
} 