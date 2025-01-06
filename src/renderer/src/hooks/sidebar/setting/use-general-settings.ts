import { useState, useEffect } from 'react'
import { BgUrlContextState } from '@/context/bgurl-context'
import { defaultBaseUrl, defaultWsUrl } from '@/context/websocket-context'

interface GeneralSettings {
  language: string[]
  customBgUrl: string
  selectedBgUrl: string[]
  backgroundUrl: string
  selectedCharacterPreset: string[]
  useCameraBackground: boolean
  wsUrl: string
  baseUrl: string
}

interface UseGeneralSettingsProps {
  bgUrlContext: BgUrlContextState | null
  confName: string | undefined
  baseUrl: string
  wsUrl: string
  onWsUrlChange: (url: string) => void
  onBaseUrlChange: (url: string) => void
}

export const useGeneralSettings = ({
  bgUrlContext,
  confName,
  baseUrl,
  wsUrl,
  onWsUrlChange,
  onBaseUrlChange
}: UseGeneralSettingsProps) => {
  const getCurrentBgKey = (): string[] => {
    if (!bgUrlContext?.backgroundUrl) return []
    const currentBgUrl = bgUrlContext.backgroundUrl
    const path = currentBgUrl.replace(baseUrl, '')
    return path.startsWith('/bg/') ? [path] : []
  }

  const initialSettings: GeneralSettings = {
    language: ['en'],
    customBgUrl: !bgUrlContext?.backgroundUrl?.includes('/bg/')
      ? bgUrlContext?.backgroundUrl || ''
      : '',
    selectedBgUrl: getCurrentBgKey(),
    backgroundUrl: bgUrlContext?.backgroundUrl || '',
    selectedCharacterPreset: [],
    useCameraBackground: bgUrlContext?.useCameraBackground || false,
    wsUrl: wsUrl || defaultWsUrl,
    baseUrl: baseUrl || defaultBaseUrl,
  }

  const [settings, setSettings] = useState<GeneralSettings>(initialSettings)
  const [originalSettings, setOriginalSettings] = useState<GeneralSettings>(initialSettings)

  // Handle config name change
  useEffect(() => {
    if (confName) {
      const newSettings = {
        ...settings,
        selectedCharacterPreset: [confName]
      }
      setSettings(newSettings)
      setOriginalSettings(newSettings)
    }
  }, [confName])

  // Handle background URL change
  useEffect(() => {
    const newBgUrl = settings.customBgUrl || settings.selectedBgUrl[0]
    if (newBgUrl && bgUrlContext) {
      const fullUrl = newBgUrl.startsWith('http') ? newBgUrl : `${baseUrl}${newBgUrl}`
      bgUrlContext.setBackgroundUrl(fullUrl)
    }
  }, [settings.selectedBgUrl, settings.customBgUrl, bgUrlContext])

  const handleSettingChange = (
    key: keyof GeneralSettings,
    value: GeneralSettings[keyof GeneralSettings]
  ): void => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    
    // 处理 URL 变更
    if (key === 'wsUrl') {
      onWsUrlChange(value as string)
    } else if (key === 'baseUrl') {
      onBaseUrlChange(value as string)
    }
  }

  const handleSave = (): void => {
    const newBgUrl = settings.customBgUrl || settings.selectedBgUrl[0]
    if (newBgUrl && bgUrlContext) {
      setOriginalSettings({ ...settings })
    }
  }

  const handleCancel = (): void => {
    setSettings(originalSettings)
    if (bgUrlContext && originalSettings.backgroundUrl) {
      bgUrlContext.setBackgroundUrl(originalSettings.backgroundUrl)
    }
  }

  return {
    settings,
    handleSettingChange,
    handleSave,
    handleCancel
  }
} 