import { useRef, useState, useEffect } from 'react'
import { useVAD, VADSettings } from '@/context/vad-context'
import React from 'react'

export const useASRSettings = () => {
  const { 
    settings, 
    updateSettings, 
    voiceInterruptionOn, 
    setVoiceInterruptionOn,
    autoStartMicOn,
    setAutoStartMicOn
  } = useVAD()
  
  const localSettingsRef = useRef<VADSettings>(settings)
  const originalSettingsRef = useRef(settings)
  const originalVoiceInterruptionOnRef = useRef(voiceInterruptionOn)
  const originalAutoStartMicOnRef = useRef(autoStartMicOn)
  const [localVoiceInterruption, setLocalVoiceInterruption] = useState(voiceInterruptionOn)
  const [localAutoStartMic, setLocalAutoStartMic] = useState(autoStartMicOn)
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  useEffect(() => {
    setLocalVoiceInterruption(voiceInterruptionOn)
    setLocalAutoStartMic(autoStartMicOn)
  }, [voiceInterruptionOn, autoStartMicOn])

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

  const handleAutoStartMicChange = (value: boolean) => {
    setLocalAutoStartMic(value)
    setAutoStartMicOn(value)
  }

  const handleSave = (): void => {
    updateSettings(localSettingsRef.current)
    originalSettingsRef.current = localSettingsRef.current
    originalVoiceInterruptionOnRef.current = localVoiceInterruption
    originalAutoStartMicOnRef.current = localAutoStartMic
  }

  const handleCancel = (): void => {
    localSettingsRef.current = originalSettingsRef.current
    setLocalVoiceInterruption(originalVoiceInterruptionOnRef.current)
    setLocalAutoStartMic(originalAutoStartMicOnRef.current)
    setVoiceInterruptionOn(originalVoiceInterruptionOnRef.current)
    setAutoStartMicOn(originalAutoStartMicOnRef.current)
    forceUpdate()
  }

  return {
    localSettings: localSettingsRef.current,
    voiceInterruptionOn: localVoiceInterruption,
    autoStartMicOn: localAutoStartMic,
    setVoiceInterruptionOn: handleVoiceInterruptionChange,
    setAutoStartMicOn: handleAutoStartMicChange,
    handleInputChange,
    handleSave,
    handleCancel
  }
} 