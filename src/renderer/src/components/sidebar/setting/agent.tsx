import { Stack, Text } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { NumberInput } from '@chakra-ui/react'
import { settingStyles } from './setting-styles'
import { useAgentSettings } from '@/hooks/sidebar/setting/use-agent-settings'

interface AgentProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

function Agent({ onSave, onCancel }: AgentProps): JSX.Element {
  const {
    settings,
    handleAllowProactiveSpeakChange,
    handleIdleSecondsChange,
  } = useAgentSettings({ onSave, onCancel })

  return (
    <Stack {...settingStyles.common.container}>
      <Field
        {...settingStyles.common.field}
        label={<Text {...settingStyles.common.fieldLabel}>Allow AI to Speak Proactively</Text>}
      >
        <Switch
          {...settingStyles.common.switch}
          checked={settings.allowProactiveSpeak}
          onCheckedChange={(details) => handleAllowProactiveSpeakChange(details.checked)}
        />
      </Field>

      {settings.allowProactiveSpeak && (
        <Field
          {...settingStyles.common.field}
          label={<Text {...settingStyles.common.fieldLabel}>Idle seconds allow AI to speak</Text>}
        >
          <NumberInput.Root
            {...settingStyles.common.numberInput.root}
            value={settings.idleSecondsToSpeak.toString()}
            onValueChange={(details) => handleIdleSecondsChange(Number(details.value))}
            min={0}
            step={0.1}
            allowMouseWheel
          >
            <NumberInput.Input {...settingStyles.common.numberInput.input} />
            <NumberInput.Control>
              <NumberInput.IncrementTrigger />
              <NumberInput.DecrementTrigger />
            </NumberInput.Control>
          </NumberInput.Root>
        </Field>
      )}
    </Stack>
  )
}

export default Agent
