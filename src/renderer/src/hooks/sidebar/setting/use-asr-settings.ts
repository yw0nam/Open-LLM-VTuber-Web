import { useRef, useState, useEffect } from 'react'
import { useVAD, VADSettings } from '@/context/vad-context'
import React from 'react'

export const useASRSettings = () => {
  const { settings, updateSettings, voiceInterruptionOn, setVoiceInterruptionOn } = useVAD()
  const localSettingsRef = useRef<VADSettings>(settings)
  const originalSettingsRef = useRef(settings)
  const originalVoiceInterruptionOnRef = useRef(voiceInterruptionOn)
  const [localVoiceInterruption, setLocalVoiceInterruption] = useState(voiceInterruptionOn)
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  useEffect(() => {
    setLocalVoiceInterruption(voiceInterruptionOn)
  }, [voiceInterruptionOn])

  const handleInputChange = (key: keyof VADSettings, value: number | string): void => {
    if (value === '' || value === '-') {
      localSettingsRef.current = { ...localSettingsRef.current, [key]: value }
    } else {
      const parsed = Number(value)
      if (!isNaN(parsed)) {
        localSettingsRef.current = { ...localSettingsRef.current, [key]: parsed }
      }
    }
    forceUpdate()
  }

  const handleVoiceInterruptionChange = (value: boolean) => {
    setLocalVoiceInterruption(value)
    setVoiceInterruptionOn(value)
  }

  const handleSave = (): void => {
    updateSettings(localSettingsRef.current)
    originalSettingsRef.current = localSettingsRef.current
    originalVoiceInterruptionOnRef.current = localVoiceInterruption
  }

  const handleCancel = (): void => {
    localSettingsRef.current = originalSettingsRef.current
    setLocalVoiceInterruption(originalVoiceInterruptionOnRef.current)
    setVoiceInterruptionOn(originalVoiceInterruptionOnRef.current)
    forceUpdate()
  }

  return {
    localSettings: localSettingsRef.current,
    voiceInterruptionOn: localVoiceInterruption,
    setVoiceInterruptionOn: handleVoiceInterruptionChange,
    handleInputChange,
    handleSave,
    handleCancel
  }
} 