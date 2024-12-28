import { Stack, Text, NumberInput } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { useEffect, useRef } from 'react'
import { settingStyles } from './setting-styles'
import { useVAD } from '@/context/vad-context'
import React from 'react'

interface ASRProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

interface ValueChangeDetails {
  value: string
}

function ASR({ onSave, onCancel }: ASRProps): JSX.Element {
  const { settings, updateSettings, voiceInterruptionOn, setVoiceInterruptionOn } = useVAD()
  const localSettingsRef = useRef(settings)
  const originalSettingsRef = useRef(settings)
  const originalVoiceInterruptionOnRef = useRef(voiceInterruptionOn)
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0)

  useEffect(() => {
    if (!onSave || !onCancel) return

    const cleanupSave = onSave(() => {
      handleSave()
    })

    const cleanupCancel = onCancel(() => {
      handleCancel()
    })

    return (): void => {
      cleanupSave?.()
      cleanupCancel?.()
    }
  }, [onSave, onCancel])

  const handleSave = (): void => {
    updateSettings(localSettingsRef.current)
    originalSettingsRef.current = localSettingsRef.current
    originalVoiceInterruptionOnRef.current = voiceInterruptionOn
  }

  const handleCancel = (): void => {
    localSettingsRef.current = originalSettingsRef.current
    setVoiceInterruptionOn(originalVoiceInterruptionOnRef.current)
    forceUpdate()
  }

  const handleInputChange = (key: keyof typeof settings, value: number | string): void => {
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
          value={localSettingsRef.current.positiveSpeechThreshold.toString()}
          onValueChange={(details: ValueChangeDetails) =>
            handleInputChange('positiveSpeechThreshold', details.value)
          }
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
          value={localSettingsRef.current.negativeSpeechThreshold.toString()}
          onValueChange={(details: ValueChangeDetails) =>
            handleInputChange('negativeSpeechThreshold', details.value)
          }
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
          value={localSettingsRef.current.redemptionFrames.toString()}
          onValueChange={(details: ValueChangeDetails) =>
            handleInputChange('redemptionFrames', details.value)
          }
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
  )
}

export default ASR
