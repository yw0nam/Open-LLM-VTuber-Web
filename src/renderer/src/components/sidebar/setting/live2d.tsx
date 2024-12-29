import { Input, HStack, Button, Text, Box, NumberInput, Stack } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import { useState, useEffect } from 'react'
import { ModelInfo, useL2D } from '@/context/l2d-context'
import { settingStyles } from './setting-styles'
import { Switch } from '@/components/ui/switch'
import { toaster } from '@/components/ui/toaster'

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

function NumberField({ label, value, onChange, step = 1 }: NumberFieldProps): JSX.Element {
  return (
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
        pattern="^-?[0-9]*\.?[0-9]*$"
      >
        <NumberInput.Input {...settingStyles.live2d.numberInput.input} />
        <NumberInput.Control>
          <NumberInput.IncrementTrigger key="increment" />
          <NumberInput.DecrementTrigger key="decrement" />
        </NumberInput.Control>
      </NumberInput.Root>
    </Field>
  )
}

function Live2d({ onSave, onCancel, activeTab }: Live2dProps): JSX.Element {
  const l2dContext = useL2D()
  const [modelInfo, setModelInfoState] = useState<ModelInfo>(
    l2dContext?.modelInfo || {
      url: '',
      kScale: 0.000625,
      initialXshift: 0,
      initialYshift: 0,
      kXOffset: 1150,
      emotionMap: {}
    }
  )
  const [originalModelInfo, setOriginalModelInfo] = useState<ModelInfo>(
    l2dContext?.modelInfo || {
      url: '',
      kScale: 0.000625,
      initialXshift: 0,
      initialYshift: 0,
      kXOffset: 1150,
      emotionMap: {}
    }
  )
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)

  useEffect(() => {
    if (l2dContext?.modelInfo && activeTab != 'live2d') {
      setOriginalModelInfo(l2dContext.modelInfo)
      setModelInfoState(l2dContext.modelInfo)
    }
  }, [l2dContext?.modelInfo])

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
  }, [onSave, onCancel, modelInfo])

  const handleSave = (): void => {
    if (l2dContext && modelInfo) {
      l2dContext.setModelInfo(modelInfo)
      setOriginalModelInfo(modelInfo)
    }
  }

  const handleCancel = (): void => {
    setModelInfoState(originalModelInfo)
    if (l2dContext && originalModelInfo) {
      l2dContext.setModelInfo(originalModelInfo)
    }
  }

  const handleInputChange = (key: keyof ModelInfo, value: ModelInfo[keyof ModelInfo]): void => {
    const now = Date.now()
    if (now - lastUpdateTime < 500) {
      toaster.create({
        title: 'Please slow down',
        description: 'Changes are being applied too quickly. Display error may occur.',
        type: 'warning',
        duration: 1000
      })
      return
    }

    setLastUpdateTime(now)
    setModelInfoState((prev) => ({ ...prev, [key]: value }))
  }

  const handleEmotionMapAdd = (): void => {
    const newKey = ''
    const newValue = 0
    setModelInfoState((prev) => ({
      ...prev,
      emotionMap: { ...prev.emotionMap, [newKey]: newValue }
    }))
  }

  const handleEmotionMapRemove = (key: string): void => {
    const updatedEmotionMap = { ...modelInfo.emotionMap }
    delete updatedEmotionMap[key]
    setModelInfoState((prev) => ({
      ...prev,
      emotionMap: updatedEmotionMap
    }))
  }

  useEffect(() => {
    if (activeTab === 'live2d' && modelInfo && l2dContext) {
      l2dContext.setModelInfo(modelInfo)
    }
  }, [modelInfo, l2dContext, activeTab])

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
        {modelInfo.emotionMap &&
          Object.entries(modelInfo.emotionMap).map(([key, value], index) => (
            <HStack {...settingStyles.live2d.emotionMap.entry} key={`emotion-${key}-${index}`}>
              <Input
                key={`input-${key}-${index}`}
                {...settingStyles.live2d.input}
                value={key}
                onChange={(e) => {
                  const newEmotionMap = { ...modelInfo.emotionMap }
                  delete newEmotionMap[key]
                  newEmotionMap[e.target.value] = value
                  handleInputChange('emotionMap', newEmotionMap)
                }}
                placeholder="Emotion Name"
              />
              <NumberInput.Root
                key={`number-input-${key}-${index}`}
                {...settingStyles.live2d.numberInput.root}
                value={value?.toString() ?? ''}
                onValueChange={(details) => {
                  const val = details.value
                  const newEmotionMap = { ...modelInfo.emotionMap }
                  if (val === '' || val === '-') {
                    newEmotionMap[key] = val
                  } else {
                    const parsed = Number(val)
                    if (!isNaN(parsed)) {
                      newEmotionMap[key] = parsed
                    }
                  }
                  handleInputChange('emotionMap', newEmotionMap)
                }}
                step={1}
                allowMouseWheel
                pattern="^-?[0-9]*\.?[0-9]*$"
              >
                <NumberInput.Input
                  key={`number-input-field-${key}-${index}`}
                  {...settingStyles.live2d.numberInput.input}
                />
                <NumberInput.Control key={`number-input-control-${key}-${index}`}>
                  <NumberInput.IncrementTrigger key={`increment-${key}-${index}`} />
                  <NumberInput.DecrementTrigger key={`decrement-${key}-${index}`} />
                </NumberInput.Control>
              </NumberInput.Root>
              <Button
                key={`delete-button-${key}-${index}`}
                {...settingStyles.live2d.emotionMap.deleteButton}
                onClick={() => handleEmotionMapRemove(key)}
              >
                Delete
              </Button>
            </HStack>
          ))}
        <Button {...settingStyles.live2d.emotionMap.button} onClick={handleEmotionMapAdd}>
          Add New Emotion
        </Button>
      </Box>
    </Stack>
  )
}

export default Live2d
