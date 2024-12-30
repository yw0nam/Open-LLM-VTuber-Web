import { useState, useEffect } from 'react'
import { BgUrlContextState } from '@/context/bgurl-context'

interface GeneralSettings {
  language: string[]
  customBgUrl: string
  selectedBgUrl: string[]
  backgroundUrl: string
  selectedCharacterPreset: string[]
}

interface UseGeneralSettingsProps {
  bgUrlContext: BgUrlContextState | null
  confName: string | undefined
  baseUrl: string
}

export const useGeneralSettings = ({
  bgUrlContext,
  confName,
  baseUrl
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
    selectedCharacterPreset: []
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