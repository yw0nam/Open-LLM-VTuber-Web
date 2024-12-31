import { Input, Stack } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText
} from '@/components/ui/select'
import { useEffect } from 'react'
import { useBgUrl } from '@/context/setting/bgurl-context'
import { settingStyles } from './setting-styles'
import { createListCollection } from '@chakra-ui/react'
import { useCharacter } from '@/context/setting/character-context'
import { useSwitchCharacter } from '@/hooks/utils/use-switch-character'
import { baseUrl } from '@/context/websocket-context'
import { useGeneralSettings } from '@/hooks/sidebar/setting/use-general-settings'

// Type definitions
interface GeneralProps {
  onSave?: (callback: () => boolean) => () => void
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
    label={label}
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
  const { configFiles } = useCharacter()

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
  const bgUrlContext = useBgUrl()
  const { confName, configFiles } = useCharacter()
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
      return true
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

  return (
    <Stack {...settingStyles.general.container}>
      <SelectField
        label="Language"
        value={settings.language}
        onChange={(value) => handleSettingChange('language', value)}
        collection={collections.languages}
        placeholder="Select language"
      />

      <SelectField
        label="Background Image"
        value={settings.selectedBgUrl}
        onChange={(value) => handleSettingChange('selectedBgUrl', value)}
        collection={collections.backgrounds}
        placeholder="Select from available backgrounds"
      />

      <Field
        {...settingStyles.general.field}
        label="Or enter a custom background URL"
      >
        <Input
          {...settingStyles.general.input}
          placeholder="Enter image URL"
          value={settings.customBgUrl}
          onChange={(e) => handleSettingChange('customBgUrl', e.target.value)}
        />
      </Field>

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
