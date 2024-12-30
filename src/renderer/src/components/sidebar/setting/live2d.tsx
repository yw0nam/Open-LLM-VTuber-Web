import { Input, HStack, Button, Text, Box, NumberInput, Stack } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import { useEffect } from 'react'
import { settingStyles } from './setting-styles'
import { Switch } from '@/components/ui/switch'
import { useLive2dSettings } from '@/hooks/sidebar/setting/use-live2d-settings'

// Type definitions
interface Live2dProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
  activeTab: string
}

interface NumberFieldProps {
  label: string
  value: number | undefined
  onChange: (value: number | string) => void
  step?: number
}

// Reusable components
const NumberField = ({ label, value, onChange, step = 1 }: NumberFieldProps): JSX.Element => (
  <Field
    {...settingStyles.live2d.field}
    label={<Text {...settingStyles.live2d.fieldLabel}>{label}</Text>}
  >
    <NumberInput.Root
      {...settingStyles.live2d.numberInput.root}
      value={value?.toString() ?? ''}
      onValueChange={(details) => {
        const val = details.value
        if (val === '' || val === '-') {
          onChange(val)
        } else {
          const parsed = Number(val)
          if (!isNaN(parsed)) {
            onChange(parsed)
          }
        }
      }}
      step={step}
      allowMouseWheel
    >
      <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
    </NumberInput.Root>
  </Field>
)

const EmotionMapEntry = ({ 
  emotionKey, 
  value, 
  onChange, 
  onDelete 
}: {
  emotionKey: string
  value: number | string
  onChange: (key: string, value: number | string) => void
  onDelete: () => void
}): JSX.Element => (
  <HStack {...settingStyles.live2d.emotionMap.entry}>
    <Input
      {...settingStyles.live2d.input}
      value={emotionKey}
      onChange={(e) => onChange(e.target.value, value)}
      placeholder="Emotion Name"
    />
    <NumberInput.Root
      {...settingStyles.live2d.numberInput.root}
      value={value?.toString() ?? ''}
      onValueChange={(details) => onChange(emotionKey, details.value)}
      step={1}
      allowMouseWheel
    >
      <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
      <NumberInput.Control>
        <NumberInput.IncrementTrigger />
        <NumberInput.DecrementTrigger />
      </NumberInput.Control>
    </NumberInput.Root>
    <Button {...settingStyles.live2d.emotionMap.deleteButton} onClick={onDelete}>
      Delete
    </Button>
  </HStack>
)

// Main component
function Live2d({ onSave, onCancel, activeTab }: Live2dProps): JSX.Element {
  const {
    modelInfo,
    handleInputChange,
    handleEmotionMapAdd,
    handleEmotionMapRemove,
    handleEmotionMapChange,
    handleSave,
    handleCancel
  } = useLive2dSettings({ activeTab })

  useEffect(() => {
    if (!onSave || !onCancel) return

    const cleanupSave = onSave(handleSave)
    const cleanupCancel = onCancel(handleCancel)

    return (): void => {
      cleanupSave?.()
      cleanupCancel?.()
    }
  }, [onSave, onCancel, handleSave, handleCancel])

  return (
    <Stack {...settingStyles.live2d.container}>
      <Field
        {...settingStyles.live2d.field}
        label={<Text {...settingStyles.live2d.fieldLabel}>Pointer Interactive</Text>}
      >
        <Switch
          {...settingStyles.live2d.switch}
          checked={modelInfo.pointerInteractive ?? false}
          onCheckedChange={(details) => handleInputChange('pointerInteractive', details.checked)}
          value="pointer-interactive"
        />
      </Field>

      <Field
        {...settingStyles.live2d.field}
        label={<Text {...settingStyles.live2d.fieldLabel}>Model URL</Text>}
      >
        <Input
          {...settingStyles.live2d.input}
          value={modelInfo.url || ''}
          onChange={(e) => handleInputChange('url', e.target.value)}
          placeholder="Please enter the model URL"
        />
      </Field>

      <NumberField
        label="Scale Factor (kScale)"
        value={modelInfo.kScale}
        onChange={(val) => handleInputChange('kScale', val)}
        step={0.0001}
      />

      <NumberField
        label="Horizontal Shift (initialXshift)"
        value={modelInfo.initialXshift}
        onChange={(val) => handleInputChange('initialXshift', val)}
        step={10}
      />

      <NumberField
        label="Vertical Shift (initialYshift)"
        value={modelInfo.initialYshift}
        onChange={(val) => handleInputChange('initialYshift', val)}
        step={10}
      />

      <NumberField
        label="X-axis Offset (kXOffset)"
        value={modelInfo.kXOffset}
        onChange={(val) => handleInputChange('kXOffset', val)}
      />

      <Box>
        <Text {...settingStyles.live2d.emotionMap.title}>Emotion Mapping</Text>
        {Object.entries(modelInfo.emotionMap).map(([key, value]) => (
          <EmotionMapEntry
            key={`emotion-${key}`}
            emotionKey={key}
            value={value}
            onChange={(newKey, newValue) => handleEmotionMapChange(key, newKey, newValue)}
            onDelete={() => handleEmotionMapRemove(key)}
          />
        ))}
        <Button {...settingStyles.live2d.emotionMap.button} onClick={handleEmotionMapAdd}>
          Add New Emotion
        </Button>
      </Box>
    </Stack>
  )
}

export default Live2d
