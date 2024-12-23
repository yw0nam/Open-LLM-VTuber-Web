import { Stack, Text, NumberInput } from "@chakra-ui/react";
import { Field } from '@/components/ui/field';
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from 'react';
import { settingStyles } from './setting-styles';
import { useVAD } from '@/context/vad-context';

interface ASRProps {
  onSave?: (callback: () => void) => (() => void);
  onCancel?: (callback: () => void) => (() => void);
}

interface ValueChangeDetails {
  value: string;
}

function ASR({ onSave, onCancel }: ASRProps) {
  const { settings, updateSettings, voiceInterruptionOn, setVoiceInterruptionOn } = useVAD();
  const [localSettings, setLocalSettings] = useState(settings);
  const [originalSettings, setOriginalSettings] = useState(settings);

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
  }, [onSave, onCancel, localSettings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setOriginalSettings(localSettings);
  };

  const handleCancel = () => {
    setLocalSettings(originalSettings);
  };

  const handleInputChange = (key: keyof typeof settings, value: number | string) => {
    if (value === "" || value === "-") {
      setLocalSettings(prev => ({ ...prev, [key]: value }));
    } else {
      const parsed = Number(value);
      if (!isNaN(parsed)) {
        setLocalSettings(prev => ({ ...prev, [key]: parsed }));
      }
    }
  };

  return (
    <Stack {...settingStyles.live2d.container}>
      <Field 
        {...settingStyles.live2d.field} 
        label={<Text {...settingStyles.live2d.fieldLabel}>Voice Interruption</Text>}
      >
        <Switch
          {...settingStyles.live2d.switch}
          checked={voiceInterruptionOn}
          onCheckedChange={(details) => setVoiceInterruptionOn(details.checked)}
          value="voice-interruption"
        />
      </Field>

      <Field 
        {...settingStyles.live2d.field} 
        label={<Text {...settingStyles.live2d.fieldLabel}>Speech Prob. Threshold</Text>}
      >
        <NumberInput.Root
          {...settingStyles.live2d.numberInput.root}
          value={localSettings.positiveSpeechThreshold.toString()}
          onValueChange={(details: ValueChangeDetails) => 
            handleInputChange('positiveSpeechThreshold', details.value)}
          min={1}
          max={100}
        >
          <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Field>

      <Field 
        {...settingStyles.live2d.field} 
        label={<Text {...settingStyles.live2d.fieldLabel}>Negative Speech Threshold</Text>}
      >
        <NumberInput.Root
          {...settingStyles.live2d.numberInput.root}
          value={localSettings.negativeSpeechThreshold.toString()}
          onValueChange={(details: ValueChangeDetails) => 
            handleInputChange('negativeSpeechThreshold', details.value)}
          min={0}
          max={100}
        >
          <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Field>

      <Field 
        {...settingStyles.live2d.field} 
        label={<Text {...settingStyles.live2d.fieldLabel}>Redemption Frames</Text>}
      >
        <NumberInput.Root
          {...settingStyles.live2d.numberInput.root}
          value={localSettings.redemptionFrames.toString()}
          onValueChange={(details: ValueChangeDetails) => 
            handleInputChange('redemptionFrames', details.value)}
          min={1}
          max={100}
        >
          <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
          <NumberInput.Control>
            <NumberInput.IncrementTrigger />
            <NumberInput.DecrementTrigger />
          </NumberInput.Control>
        </NumberInput.Root>
      </Field>
    </Stack>
  );
}

export default ASR; 