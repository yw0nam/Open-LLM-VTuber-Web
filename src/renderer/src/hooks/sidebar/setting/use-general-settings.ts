/* eslint-disable import/order */
/* eslint-disable no-use-before-define */
import { useState, useEffect, useCallback } from "react";
import { BgUrlContextState } from "@/context/bgurl-context";
import { defaultBaseUrl, defaultWsUrl } from "@/context/websocket-context";
import { useSubtitle } from "@/context/subtitle-context";
import { useCamera } from "@/context/camera-context";
import { useSwitchCharacter } from "@/hooks/utils/use-switch-character";
import { useConfig } from "@/context/character-config-context";
import { wsService } from "@/services/websocket-service/client";
import i18n from "i18next";

export const IMAGE_COMPRESSION_QUALITY_KEY = "appImageCompressionQuality";
export const DEFAULT_IMAGE_COMPRESSION_QUALITY = 0.8;
export const IMAGE_MAX_WIDTH_KEY = "appImageMaxWidth";
export const DEFAULT_IMAGE_MAX_WIDTH = 0;
export const USER_ID_KEY = "user_id";
export const DEFAULT_USER_ID = "default-user";
export const AGENT_ID_KEY = "agent_id";
export const DEFAULT_AGENT_ID = "default-agent";
export const AUTH_TOKEN_KEY = "authToken";
export const DEFAULT_AUTH_TOKEN = "";

interface GeneralSettings {
  language: string[];
  customBgUrl: string;
  selectedBgUrl: string[];
  backgroundUrl: string;
  selectedCharacterPreset: string[];
  useCameraBackground: boolean;
  wsUrl: string;
  baseUrl: string;
  showSubtitle: boolean;
  imageCompressionQuality: number;
  imageMaxWidth: number;
  userId: string;
  agentId: string;
  authToken: string;
}

interface UseGeneralSettingsProps {
  bgUrlContext: BgUrlContextState | null;
  confName: string | undefined;
  setConfName: (name: string) => void;
  baseUrl: string;
  wsUrl: string;
  onWsUrlChange: (url: string) => void;
  onBaseUrlChange: (url: string) => void;
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

const loadInitialCompressionQuality = (): number => {
  const storedQuality = localStorage.getItem(IMAGE_COMPRESSION_QUALITY_KEY);
  if (storedQuality) {
    const quality = parseFloat(storedQuality);
    if (!Number.isNaN(quality) && quality >= 0.1 && quality <= 1.0) {
      return quality;
    }
  }
  return DEFAULT_IMAGE_COMPRESSION_QUALITY;
};

const loadInitialImageMaxWidth = (): number => {
  const storedMaxWidth = localStorage.getItem(IMAGE_MAX_WIDTH_KEY);
  if (storedMaxWidth) {
    const maxWidth = parseInt(storedMaxWidth, 10);
    if (!Number.isNaN(maxWidth) && maxWidth >= 0) {
      return maxWidth;
    }
  }
  return DEFAULT_IMAGE_MAX_WIDTH;
};

export const useGeneralSettings = ({
  bgUrlContext,
  confName,
  setConfName,
  baseUrl,
  wsUrl,
  onWsUrlChange,
  onBaseUrlChange,
  onSave,
  onCancel,
}: UseGeneralSettingsProps) => {
  const { showSubtitle, setShowSubtitle } = useSubtitle();
  const { setUseCameraBackground } = bgUrlContext || {};
  const { startBackgroundCamera, stopBackgroundCamera } = useCamera();
  const { configFiles, getFilenameByName } = useConfig();
  const { switchCharacter } = useSwitchCharacter();

  const getCurrentBgKey = (): string[] => {
    if (!bgUrlContext?.backgroundUrl) return [];
    const currentBgUrl = bgUrlContext.backgroundUrl;
    const path = currentBgUrl.replace(baseUrl, "");
    return path.startsWith("/bg/") ? [path] : [];
  };

  const getCurrentCharacterFilename = (): string[] => {
    if (!confName) return [];
    const filename = getFilenameByName(confName);
    return filename ? [filename] : [];
  };

  const initialSettings: GeneralSettings = {
    language: [i18n.language || "en"],
    customBgUrl: !bgUrlContext?.backgroundUrl?.includes("/bg/")
      ? bgUrlContext?.backgroundUrl || ""
      : "",
    selectedBgUrl: getCurrentBgKey(),
    backgroundUrl: bgUrlContext?.backgroundUrl || "",
    selectedCharacterPreset: getCurrentCharacterFilename(),
    useCameraBackground: bgUrlContext?.useCameraBackground || false,
    wsUrl: wsUrl || defaultWsUrl,
    baseUrl: baseUrl || defaultBaseUrl,
    showSubtitle,
    imageCompressionQuality: loadInitialCompressionQuality(),
    imageMaxWidth: loadInitialImageMaxWidth(),
    userId: localStorage.getItem(USER_ID_KEY) || DEFAULT_USER_ID,
    agentId: localStorage.getItem(AGENT_ID_KEY) || DEFAULT_AGENT_ID,
    authToken: localStorage.getItem(AUTH_TOKEN_KEY) || DEFAULT_AUTH_TOKEN,
  };

  const [settings, setSettings] = useState<GeneralSettings>(initialSettings);
  const [originalSettings, setOriginalSettings] =
    useState<GeneralSettings>(initialSettings);
  const [originalConfNameState, setOriginalConfNameState] = useState(confName);

  // Sync originalSettings when external confName changes (e.g., character switch from elsewhere)
  useEffect(() => {
    if (confName) {
      const filename = getFilenameByName(confName);
      if (filename) {
        const newSettings = {
          ...settings,
          selectedCharacterPreset: [filename],
        };
        setSettings(newSettings);
        setOriginalSettings(newSettings);
        setOriginalConfNameState(confName);
      }
    }
  }, [confName]);

  const handleSettingChange = useCallback((
    key: keyof GeneralSettings,
    value: GeneralSettings[keyof GeneralSettings],
  ): void => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback((): void => {
    // Apply subtitle setting
    setShowSubtitle(settings.showSubtitle);

    // Apply background URL
    const newBgUrl = settings.customBgUrl || settings.selectedBgUrl[0];
    if (newBgUrl && bgUrlContext) {
      const fullUrl = newBgUrl.startsWith("http")
        ? newBgUrl
        : `${baseUrl}${newBgUrl}`;
      bgUrlContext.setBackgroundUrl(fullUrl);
    }

    // Apply language change
    if (
      settings.language &&
      settings.language[0] &&
      settings.language[0] !== i18n.language
    ) {
      i18n.changeLanguage(settings.language[0]);
    }

    // Save to localStorage
    localStorage.setItem(
      IMAGE_COMPRESSION_QUALITY_KEY,
      settings.imageCompressionQuality.toString(),
    );
    localStorage.setItem(
      IMAGE_MAX_WIDTH_KEY,
      settings.imageMaxWidth.toString(),
    );
    localStorage.setItem(USER_ID_KEY, settings.userId);
    localStorage.setItem(AGENT_ID_KEY, settings.agentId);
    if (settings.authToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, settings.authToken);
      wsService.setAuthToken(settings.authToken);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    // Apply WebSocket and base URL changes
    onWsUrlChange(settings.wsUrl);
    onBaseUrlChange(settings.baseUrl);

    // Update original settings baseline
    setOriginalSettings(settings);
    setOriginalConfNameState(confName);
  }, [settings, bgUrlContext, baseUrl, setShowSubtitle, onWsUrlChange, onBaseUrlChange, confName]);

  const handleCancel = useCallback((): void => {
    setSettings(originalSettings);

    // Revert language in i18n if it was changed during editing
    if (
      originalSettings.language &&
      originalSettings.language[0] &&
      originalSettings.language[0] !== i18n.language
    ) {
      i18n.changeLanguage(originalSettings.language[0]);
    }

    // Revert character preset if it was changed during editing
    if (originalConfNameState && originalConfNameState !== confName) {
      setConfName(originalConfNameState);
    }
  }, [
    originalSettings,
    originalConfNameState,
    confName,
    setConfName,
  ]);

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(() => {
      handleSave();
    });

    const cleanupCancel = onCancel(() => {
      handleCancel();
    });

    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  const handleCharacterPresetChange = (value: string[]): void => {
    const selectedFilename = value[0];
    const selectedConfig = configFiles.find(
      (config) => config.filename === selectedFilename,
    );
    const currentFilename = confName ? getFilenameByName(confName) : "";

    handleSettingChange("selectedCharacterPreset", value);

    if (currentFilename === selectedFilename) {
      return;
    }

    if (selectedConfig) {
      switchCharacter(selectedFilename);
    }
  };

  const handleCameraToggle = async (checked: boolean) => {
    if (!setUseCameraBackground) return;

    if (checked) {
      try {
        await startBackgroundCamera();
        handleSettingChange("useCameraBackground", true);
        setUseCameraBackground(true);
      } catch (error) {
        console.error("Failed to start camera:", error);
        handleSettingChange("useCameraBackground", false);
        setUseCameraBackground(false);
      }
    } else {
      stopBackgroundCamera();
      handleSettingChange("useCameraBackground", false);
      setUseCameraBackground(false);
    }
  };

  return {
    settings,
    handleSettingChange,
    handleSave,
    handleCancel,
    handleCameraToggle,
    handleCharacterPresetChange,
    showSubtitle,
    setShowSubtitle,
  };
};
