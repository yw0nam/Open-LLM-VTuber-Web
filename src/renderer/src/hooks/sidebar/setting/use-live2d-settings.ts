import { useState, useEffect } from 'react'
import { ModelInfo, useL2D } from '@/context/setting/live2d-context'
import { toaster } from '@/components/ui/toaster'

interface UseLive2dSettingsProps {
  activeTab: string
}

export const useLive2dSettings = ({ activeTab }: UseLive2dSettingsProps) => {
  const l2dContext = useL2D()
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  
  const initialModelInfo: ModelInfo = {
    url: '',
    kScale: 0.000625,
    initialXshift: 0,
    initialYshift: 0,
    kXOffset: 1150,
    emotionMap: {}
  }

  const [modelInfo, setModelInfoState] = useState<ModelInfo>(
    l2dContext?.modelInfo || initialModelInfo
  )
  const [originalModelInfo, setOriginalModelInfo] = useState<ModelInfo>(
    l2dContext?.modelInfo || initialModelInfo
  )

  useEffect(() => {
    if (l2dContext?.modelInfo && activeTab !== 'live2d') {
      setOriginalModelInfo(l2dContext.modelInfo)
      setModelInfoState(l2dContext.modelInfo)
    }
  }, [l2dContext?.modelInfo])

  useEffect(() => {
    if (activeTab === 'live2d' && modelInfo && l2dContext) {
      l2dContext.setModelInfo(modelInfo)
    }
  }, [modelInfo, l2dContext, activeTab])

  const handleInputChange = (key: keyof ModelInfo, value: ModelInfo[keyof ModelInfo]): void => {
    const now = Date.now()
    if (now - lastUpdateTime < 500) {
      toaster.create({
        title: 'Please slow down',
        description: 'Changes are being applied too quickly. Display error may occur.',
        type: 'warning',
        duration: 1000
      })
      return
    }

    setLastUpdateTime(now)
    setModelInfoState((prev) => ({ ...prev, [key]: value }))
  }

  const handleEmotionMapAdd = (): void => {
    setModelInfoState((prev) => ({
      ...prev,
      emotionMap: { ...prev.emotionMap, '': 0 }
    }))
  }

  const handleEmotionMapRemove = (key: string): void => {
    setModelInfoState((prev) => {
      const updatedEmotionMap = { ...prev.emotionMap }
      delete updatedEmotionMap[key]
      return { ...prev, emotionMap: updatedEmotionMap }
    })
  }

  const handleEmotionMapChange = (
    key: string,
    newKey: string,
    value: number | string
  ): void => {
    setModelInfoState((prev) => {
      const newEmotionMap = { ...prev.emotionMap }
      delete newEmotionMap[key]
      newEmotionMap[newKey] = value
      return { ...prev, emotionMap: newEmotionMap }
    })
  }

  const handleSave = (): boolean => {
    if (l2dContext && modelInfo) {
      l2dContext.setModelInfo(modelInfo)
      setOriginalModelInfo(modelInfo)
    }
    return true
  }

  const handleCancel = (): void => {
    setModelInfoState(originalModelInfo)
    if (l2dContext && originalModelInfo) {
      l2dContext.setModelInfo(originalModelInfo)
    }
  }

  return {
    modelInfo,
    handleInputChange,
    handleEmotionMapAdd,
    handleEmotionMapRemove,
    handleEmotionMapChange,
    handleSave,
    handleCancel
  }
} 