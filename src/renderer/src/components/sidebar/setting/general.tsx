import { Input, Text, Stack } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText
} from '@/components/ui/select'
import { useEffect } from 'react'
import { useBgUrl } from '@/context/bgurl-context'
import { settingStyles } from './setting-styles'
import { createListCollection } from '@chakra-ui/react'
import { useConfig } from '@/context/character-config-context'
import { useSwitchCharacter } from '@/hooks/utils/use-switch-character'
import { baseUrl } from '@/context/websocket-context'
import { useGeneralSettings } from '@/hooks/sidebar/setting/use-general-settings'
import { useCamera } from '@/context/camera-context'
import { Switch } from "@/components/ui/switch"

// Type definitions
interface GeneralProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

interface SelectFieldProps {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  collection: ReturnType<typeof createListCollection<{ label: string; value: string }>>
  placeholder: string
}

// Reusable select component
const SelectField = ({
  label,
  value,
  onChange,
  collection,
  placeholder
}: SelectFieldProps): JSX.Element => (
  <Field
    {...settingStyles.general.field}
    label={<Text {...settingStyles.general.field.label}>{label}</Text>}
  >
    <SelectRoot
      {...settingStyles.general.select.root}
      collection={collection}
      value={value}
      onValueChange={(e) => onChange(e.value)}
    >
      <SelectTrigger {...settingStyles.general.select.trigger}>
        <SelectValueText placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {collection.items.map((item) => (
          <SelectItem key={item.value} item={item}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  </Field>
)

// Data collection definition
const useCollections = () => {
  const { backgroundFiles } = useBgUrl() || {}
  const { configFiles } = useConfig()

  const languages = createListCollection({
    items: [
      { label: 'English', value: 'en' },
      { label: '中文', value: 'zh' }
    ]
  })

  const backgrounds = createListCollection({
    items: backgroundFiles?.map((filename) => ({
      label: String(filename),
      value: `/bg/${filename}`
    })) || []
  })

  const characterPresets = createListCollection({
    items: configFiles.map((config) => ({
      label: config.name,
      value: config.filename
    }))
  })

  return {
    languages,
    backgrounds,
    characterPresets
  }
}

// Main component
function General({ onSave, onCancel }: GeneralProps): JSX.Element {
  const { useCameraBackground, setUseCameraBackground } = useBgUrl()
  const { startBackgroundCamera, stopBackgroundCamera } = useCamera()
  const bgUrlContext = useBgUrl()
  const { confName, configFiles } = useConfig()
  const { switchCharacter } = useSwitchCharacter()
  const collections = useCollections()
  
  const {
    settings,
    handleSettingChange,
    handleSave,
    handleCancel
  } = useGeneralSettings({
    bgUrlContext,
    confName,
    baseUrl
  })

  // Save and cancel side effects
  useEffect(() => {
    if (!onSave || !onCancel) return

    const cleanupSave = onSave(() => {
      console.log('Saving general settings...')
      handleSave()
    })

    const cleanupCancel = onCancel(() => {
      console.log('Canceling general settings...')
      handleCancel()
    })

    return () => {
      cleanupSave?.()
      cleanupCancel?.()
    }
  }, [onSave, onCancel, handleSave, handleCancel])

  // Preset change handler
  const handleCharacterPresetChange = (value: string[]): void => {
    const selectedFilename = value[0]
    const selectedConfig = configFiles.find(config => config.filename === selectedFilename)
    
    if (selectedConfig && selectedConfig.name !== confName) {
      switchCharacter(selectedFilename)
      handleSettingChange('selectedCharacterPreset', value)
    }
  }

  const handleCameraToggle = async (checked: boolean) => {
    setUseCameraBackground(checked)
    if (checked) {
      try {
        await startBackgroundCamera()
      } catch (error) {
        console.error('Failed to start camera:', error)
        setUseCameraBackground(false)
      }
    } else {
      stopBackgroundCamera()
    }
  }

  return (
    <Stack {...settingStyles.common.container}>
      <SelectField
        label="Language"
        value={settings.language}
        onChange={(value) => handleSettingChange('language', value)}
        collection={collections.languages}
        placeholder="Select language"
      />

      <Field
        {...settingStyles.common.field}
        label={<Text {...settingStyles.common.fieldLabel}>Use Camera Background</Text>}
      >
        <Switch
          {...settingStyles.common.switch}
          checked={useCameraBackground}
          onCheckedChange={({ checked }) => handleCameraToggle(checked)}
        />
      </Field>

      {!useCameraBackground && (
        <>
          <SelectField
            label="Background Image"
            value={settings.selectedBgUrl}
            onChange={(value) => handleSettingChange('selectedBgUrl', value)}
            collection={collections.backgrounds}
            placeholder="Select from available backgrounds"
          />

          <Field
            {...settingStyles.general.field}
            label={<Text {...settingStyles.general.field.label}>Or enter a custom background URL</Text>}
          >
            <Input
              {...settingStyles.general.input}
              placeholder="Enter image URL"
              value={settings.customBgUrl}
              onChange={(e) => handleSettingChange('customBgUrl', e.target.value)}
            />
          </Field>
        </>
      )}

      <SelectField
        label="Character Preset"
        value={settings.selectedCharacterPreset}
        onChange={handleCharacterPresetChange}
        collection={collections.characterPresets}
        placeholder={confName || 'Select character preset'}
      />
    </Stack>
  )
}

export default General
