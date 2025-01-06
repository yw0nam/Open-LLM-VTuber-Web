import { useState, useEffect } from 'react'
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context'

interface UseLive2dSettingsProps {
  activeTab: string
}

export const useLive2dSettings = ({ activeTab }: UseLive2dSettingsProps) => {
  const Live2DConfigContext = useLive2DConfig()
  
  const initialModelInfo: ModelInfo = {
    url: '',
    kScale: 0.000625,
    initialXshift: 0,
    initialYshift: 0,
    kXOffset: 1150,
    emotionMap: {},
    scrollToResize: true
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
  }, [activeTab])

  const handleInputChange = (key: keyof ModelInfo, value: ModelInfo[keyof ModelInfo]): void => {
    setModelInfoState((prev) => ({ ...prev, [key]: value }))
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
    handleSave,
    handleCancel
  }
} 