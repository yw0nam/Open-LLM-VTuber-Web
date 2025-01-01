import { useState, useEffect } from 'react'
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context'
import { toaster } from '@/components/ui/toaster'

interface UseLive2dSettingsProps {
  activeTab: string
}

export const useLive2dSettings = ({ activeTab }: UseLive2dSettingsProps) => {
  const Live2DConfigContext = useLive2DConfig()
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
    Live2DConfigContext?.modelInfo || initialModelInfo
  )
  const [originalModelInfo, setOriginalModelInfo] = useState<ModelInfo>(
    Live2DConfigContext?.modelInfo || initialModelInfo
  )

  useEffect(() => {
    if (Live2DConfigContext?.modelInfo && activeTab !== 'live2d') {
      setOriginalModelInfo(Live2DConfigContext.modelInfo)
      setModelInfoState(Live2DConfigContext.modelInfo)
    }
  }, [Live2DConfigContext?.modelInfo])

  useEffect(() => {
    if (activeTab === 'live2d' && modelInfo && Live2DConfigContext) {
      Live2DConfigContext.setModelInfo(modelInfo)
    }
  }, [modelInfo, Live2DConfigContext, activeTab])

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

  const handleSave = (): void => {
    if (Live2DConfigContext && modelInfo) {
      Live2DConfigContext.setModelInfo(modelInfo)
      setOriginalModelInfo(modelInfo)
    }
  }

  const handleCancel = (): void => {
    setModelInfoState(originalModelInfo)
    if (Live2DConfigContext && originalModelInfo) {
      Live2DConfigContext.setModelInfo(originalModelInfo)
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