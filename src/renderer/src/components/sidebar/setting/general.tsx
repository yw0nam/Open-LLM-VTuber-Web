import { Input, Text, Stack } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText
} from '@/components/ui/select'
import { useBgUrl } from '@/context/bgurl-context'
import { settingStyles } from './setting-styles'
import { createListCollection } from '@chakra-ui/react'
import { useConfig } from '@/context/character-config-context'
import { useGeneralSettings } from '@/hooks/sidebar/setting/use-general-settings'
import { Switch } from "@/components/ui/switch"
import { useWebSocket } from '@/context/websocket-context'

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
  const bgUrlContext = useBgUrl()
  const { confName } = useConfig()
  const { wsUrl, setWsUrl, baseUrl, setBaseUrl } = useWebSocket()
  const collections = useCollections()

  const {
    settings,
    handleSettingChange,
    handleCameraToggle,
    handleCharacterPresetChange,
    showSubtitle,
    setShowSubtitle
  } = useGeneralSettings({
    bgUrlContext,
    confName,
    baseUrl,
    wsUrl,
    onWsUrlChange: setWsUrl,
    onBaseUrlChange: setBaseUrl,
    onSave,
    onCancel
  })

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
          checked={settings.useCameraBackground}
          onCheckedChange={({ checked }) => handleCameraToggle(checked)}
        />
      </Field>

      <Field
        {...settingStyles.common.field}
        label={<Text {...settingStyles.common.fieldLabel}>Show Subtitle</Text>}
      >
        <Switch
          {...settingStyles.common.switch}
          checked={showSubtitle}
          onCheckedChange={({ checked }) => setShowSubtitle(checked)}
        />
      </Field>

      {!settings.useCameraBackground && (
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

      <Field
        {...settingStyles.general.field}
        label={<Text {...settingStyles.general.field.label}>WebSocket URL</Text>}
      >
        <Input
          {...settingStyles.general.input}
          placeholder="Enter WebSocket URL"
          value={settings.wsUrl}
          onChange={(e) => handleSettingChange('wsUrl', e.target.value)}
        />
      </Field>

      <Field
        {...settingStyles.general.field}
        label={<Text {...settingStyles.general.field.label}>Base URL</Text>}
      >
        <Input
          {...settingStyles.general.input}
          placeholder="Enter Base URL"
          value={settings.baseUrl}
          onChange={(e) => handleSettingChange('baseUrl', e.target.value)}
        />
      </Field>
    </Stack>
  )
}

export default General
