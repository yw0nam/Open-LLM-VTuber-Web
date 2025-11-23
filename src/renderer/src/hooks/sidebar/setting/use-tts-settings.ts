import { useState, useEffect, useCallback } from "react";

export const REFERENCE_VOICE_KEY = "tts_reference_voice";
export const DEFAULT_REFERENCE_VOICE = "";

interface TTSSettings {
  referenceVoice: string;
}

interface UseTTSSettingsProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

export const useTTSSettings = ({
  onSave,
  onCancel,
}: UseTTSSettingsProps = {}) => {
  const initialSettings: TTSSettings = {
    referenceVoice: localStorage.getItem(REFERENCE_VOICE_KEY) || DEFAULT_REFERENCE_VOICE,
  };

  const [settings, setSettings] = useState<TTSSettings>(initialSettings);
  const [originalSettings, setOriginalSettings] = useState<TTSSettings>(initialSettings);

  // Persist reference voice to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(REFERENCE_VOICE_KEY, settings.referenceVoice);
  }, [settings.referenceVoice]);

  const handleSettingChange = useCallback((
    key: keyof TTSSettings,
    value: TTSSettings[keyof TTSSettings],
  ): void => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback((): void => {
    setOriginalSettings(settings);
  }, [settings]);

  const handleCancel = useCallback((): void => {
    setSettings(originalSettings);
  }, [originalSettings]);

  // Register save/cancel callbacks with parent component
  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  return {
    settings,
    handleSettingChange,
  };
};
