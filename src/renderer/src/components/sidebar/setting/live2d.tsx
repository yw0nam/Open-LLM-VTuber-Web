import { Stack, Text } from '@chakra-ui/react'
import { Field } from '@/components/ui/field'
import { Switch } from "@/components/ui/switch"
import { useEffect } from 'react'
import { settingStyles } from './setting-styles'
import { useLive2dSettings } from '@/hooks/sidebar/setting/use-live2d-settings'

interface live2DProps {
  onSave?: (callback: () => void) => () => void
  onCancel?: (callback: () => void) => () => void
}

function live2D({ onSave, onCancel }: live2DProps): JSX.Element {
  const {
    modelInfo,
    handleInputChange,
    handleSave,
    handleCancel,
  } = useLive2dSettings();

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(handleSave);
    const cleanupCancel = onCancel(handleCancel);

    return (): void => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, handleSave, handleCancel]);

  return (
    <Stack {...settingStyles.common.container}>
      <Field
        {...settingStyles.common.field}
        label={<Text {...settingStyles.common.fieldLabel}>Pointer Interactive</Text>}
      >
        <Switch
          {...settingStyles.common.switch}
          checked={modelInfo.pointerInteractive ?? false}
          onCheckedChange={(details) =>
            handleInputChange("pointerInteractive", details.checked)
          }
        />
      </Field>

      <Field
        {...settingStyles.common.field}
        label={<Text {...settingStyles.common.fieldLabel}>Enable Scroll to Resize</Text>}
      >
        <Switch
          {...settingStyles.common.switch}
          checked={modelInfo.scrollToResize ?? true}
          onCheckedChange={(details) =>
            handleInputChange("scrollToResize", details.checked)
          }
        />
      </Field>
    </Stack>
  );
}

export default live2D;
