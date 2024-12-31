import { useCharacter } from "@/context/setting/character-context";
import { useVAD } from "@/context/vad-context";
import { set } from "lodash";
import { useState, useEffect } from "react";
import Ajv from 'ajv';

export const useASRSettings = () => {
  const { asrSchema, asrValues, setAsrValues } = useCharacter();
  const { settings: vadSettings, updateSettings: updateVadSettings, voiceInterruptionOn, setVoiceInterruptionOn } = useVAD();

  const [tempVadSettings, setTempVadSettings] = useState(vadSettings);
  const [tempAsrValues, setTempAsrValues] = useState(asrValues);
  const [tempVoiceInterruption, setTempVoiceInterruption] = useState(voiceInterruptionOn);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setTempVadSettings(vadSettings);
    setTempVoiceInterruption(voiceInterruptionOn);
  }, [vadSettings, voiceInterruptionOn]);

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
    const newValues = JSON.parse(JSON.stringify(tempAsrValues)); 
    set(newValues, path, value);
    setTempAsrValues(newValues);
  };

  const saveSettings = () => {
    console.log('Starting validation with schema:', asrSchema);
    console.log('Validating values:', tempAsrValues);

    // convert empty string to null
    const valuesToValidate = JSON.parse(JSON.stringify(tempAsrValues));
    const currentModel = valuesToValidate.asr_model;
    if (valuesToValidate[currentModel]) {
      Object.keys(valuesToValidate[currentModel]).forEach(key => {
        if (valuesToValidate[currentModel][key] === '') {
          valuesToValidate[currentModel][key] = null;
        }
      });
    }

    const ajv = new Ajv({allErrors: true, validateSchema: false});
    const validate = ajv.compile(asrSchema);
    const valid = validate(valuesToValidate);

    console.log('Validation result:', valid);
    console.log('Validation errors:', validate.errors);

    if (!valid) {
      const errorObj: { [key: string]: string } = {};
      validate.errors?.forEach((error) => {
        const field = error.instancePath.slice(1).replace(/\//g, '.');
        console.log('Error for field:', field, error.message);
        errorObj[field] = error.message || 'Validation error';
      });
      setErrors(errorObj);
      console.log('Setting errors:', errorObj);
      return false;
    }

    console.log('Validation passed, saving settings');
    updateVadSettings(tempVadSettings);
    setAsrValues(tempAsrValues);
    setVoiceInterruptionOn(tempVoiceInterruption);
    return true;
  };

  const resetSettings = () => {
    setTempVadSettings(vadSettings);
    setTempAsrValues(asrValues);
    setTempVoiceInterruption(voiceInterruptionOn);
  };

  return {
    vadSettings: tempVadSettings,
    onVadSettingChange: handleVadSettingChange,
    voiceInterruption: tempVoiceInterruption,
    onVoiceInterruptionChange: setTempVoiceInterruption,
    asrSchema,
    asrValues: tempAsrValues,
    onASRValueChange: handleASRValueChange,
    saveSettings,
    resetSettings,
    errors,
  };
};
