import { Stack } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { NumberInputField, NumberInputRoot } from '@/components/ui/number-input'
import { useASRSettings } from '@/hooks/sidebar/setting/use-asr-settings'
import { SchemaForm } from './schema-form'
import { settingStyles } from './setting-styles'
import { useEffect } from 'react'
import { useVAD } from '@/context/vad-context'

interface ASRProps {
  onSave?: (callback: () => boolean) => () => void
  onCancel?: (callback: () => void) => () => void
}

function ASR({ onSave, onCancel }: ASRProps): JSX.Element {
  const {
    vadSettings,
    onVadSettingChange,
    voiceInterruption,
    onVoiceInterruptionChange,
    asrSchema,
    asrValues,
    onASRValueChange,
    saveSettings,
    resetSettings,
    errors,
  } = useASRSettings()

  useEffect(() => {
    if (!onSave || !onCancel) return

    const handleSave = () => {
      const success = saveSettings();
      return success;
    };

    const cleanupSave = onSave(handleSave)

    const cleanupCancel = onCancel(() => {
      resetSettings();
    })

    return () => {
      cleanupSave?.()
      cleanupCancel?.()
    }
  }, [onSave, onCancel, saveSettings, resetSettings])

  return (
    <Stack {...settingStyles.live2d.container}>
      {/* Voice Interruption Switch */}
      <Field 
        {...settingStyles.live2d.field}
        label="Voice Interruption"
      >
        <Switch
          {...settingStyles.live2d.switch}
          checked={voiceInterruption}
          onCheckedChange={({ checked }) => onVoiceInterruptionChange(checked)}
        />
      </Field>

      {/* VAD Settings */}
      <Field 
        {...settingStyles.live2d.field}
        label="Speech Prob. Threshold"
      >
        <NumberInputRoot 
          {...settingStyles.live2d.numberInput.root}
          value={vadSettings.positiveSpeechThreshold.toString()}
          onValueChange={(e) => onVadSettingChange('positiveSpeechThreshold', Number(e.value))}
          min={1}
          max={100}
        >
          <NumberInputField {...settingStyles.live2d.numberInput.input} />
        </NumberInputRoot>
      </Field>

      <Field 
        {...settingStyles.live2d.field}
        label="Negative Speech Threshold"
      >
        <NumberInputRoot 
          {...settingStyles.live2d.numberInput.root}
          value={vadSettings.negativeSpeechThreshold.toString()}
          onValueChange={(e) => onVadSettingChange('negativeSpeechThreshold', Number(e.value))}
          min={0}
          max={100}
        >
          <NumberInputField {...settingStyles.live2d.numberInput.input} />
        </NumberInputRoot>
      </Field>

      <Field 
        {...settingStyles.live2d.field}
        label="Redemption Frames"
      >
        <NumberInputRoot 
          {...settingStyles.live2d.numberInput.root}
          value={vadSettings.redemptionFrames.toString()}
          onValueChange={(e) => onVadSettingChange('redemptionFrames', Number(e.value))}
          min={1}
          max={100}
        >
          <NumberInputField {...settingStyles.live2d.numberInput.input} />
        </NumberInputRoot>
      </Field>

      {/* ASR Model Configuration Form */}
      <SchemaForm
        schema={asrSchema}
        value={asrValues}
        onChange={onASRValueChange}
        definitions={asrSchema.$defs}
        errors={errors}
        dependencies={{
          // Define dependencies: show corresponding config when asr_model changes
          asr_model: {
            field: 'asr_model',
            mapping: {
              'faster_whisper': ['faster_whisper'],
              'whisper_cpp': ['whisper_cpp'],
              'whisper': ['whisper'],
              'azure_asr': ['azure_asr'],
              'fun_asr': ['fun_asr'],
              'groq_whisper_asr': ['groq_whisper_asr'],
              'sherpa_onnx_asr': ['sherpa_onnx_asr']
            }
          }
        }}
      />
    </Stack>
  )
}

export default ASR
