import { useCharacter } from "@/context/setting/character-context";
import { useVAD } from "@/context/vad-context";
import { set } from "lodash";
import { useState, useEffect } from "react";

export const useASRSettings = () => {
  const { asrSchema, asrValues, setAsrValues } = useCharacter();
  const { settings: vadSettings, updateSettings: updateVadSettings } = useVAD();

  const [tempVadSettings, setTempVadSettings] = useState(vadSettings);
  const [tempAsrValues, setTempAsrValues] = useState(asrValues);

  useEffect(() => {
    setTempVadSettings(vadSettings);
  }, [vadSettings]);

  useEffect(() => {
    setTempAsrValues(asrValues);
  }, [asrValues]);

  const handleVadSettingChange = (key: keyof typeof vadSettings, value: any) => {
    setTempVadSettings({
      ...tempVadSettings,
      [key]: value,
    });
  };

  const handleASRValueChange = (path: string[], value: any) => {
    const newValues = JSON.parse(JSON.stringify(tempAsrValues)); // 深拷贝
    set(newValues, path, value);
    setTempAsrValues(newValues);
  };

  const saveSettings = () => {
    updateVadSettings(tempVadSettings);
    setAsrValues(tempAsrValues);
    return true;
  };

  const resetSettings = () => {
    setTempVadSettings(vadSettings);
    setTempAsrValues(asrValues);
  };

  return {
    vadSettings: tempVadSettings,
    onVadSettingChange: handleVadSettingChange,
    asrSchema,
    asrValues: tempAsrValues,
    onASRValueChange: handleASRValueChange,
    saveSettings,
    resetSettings,
  };
};
