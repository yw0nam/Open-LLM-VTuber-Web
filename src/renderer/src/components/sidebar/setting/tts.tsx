import { useTranslation } from "react-i18next";
import { Stack } from "@chakra-ui/react";
import { settingStyles } from "./setting-styles";
import { useTTSSettings } from "@/hooks/sidebar/setting/use-tts-settings";
import { InputField } from "./common";

interface TTSProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

function TTS({ onSave, onCancel }: TTSProps): JSX.Element {
  const { t } = useTranslation();
  const { settings, handleSettingChange } = useTTSSettings({
    onSave,
    onCancel,
  });

  return (
    <Stack {...settingStyles.common.container}>
      <InputField
        label={t("settings.tts.referenceVoice")}
        value={settings.referenceVoice}
        onChange={(value) => handleSettingChange("referenceVoice", value)}
        placeholder="Enter reference voice ID (e.g., ナツメ)"
        help={t("settings.tts.referenceVoiceHelp")}
      />
    </Stack>
  );
}

export default TTS;
