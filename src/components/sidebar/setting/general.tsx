import { 
  Input,
  Text,
  Stack,
} from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select"
import { useEffect, useState } from 'react';
import { useBgUrl } from '@/context/bgurl-context';
import { settingStyles } from './setting-styles';
import { createListCollection } from '@chakra-ui/react';
import { useConfig } from '@/context/config-context';
import { useSwitchCharacter } from '@/hooks/use-switch-character';

interface GeneralProps {
  onSave?: (callback: () => void) => (() => void);
  onCancel?: (callback: () => void) => (() => void);
}

interface GeneralSettings {
  language: string[];
  customBgUrl: string;
  selectedBgUrl: string[];
  backgroundUrl: string;
  selectedCharacterPreset: string[];
}

interface SelectFieldProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  collection: ReturnType<typeof createListCollection<{label: string; value: string}>>;
  placeholder: string;
}

function SelectField({ label, value, onChange, collection, placeholder }: SelectFieldProps) {
  return (
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
  );
}

function General({ onSave, onCancel }: GeneralProps) {
  const bgUrlContext = useBgUrl();
  const { configFiles, confName } = useConfig();
  const { switchCharacter } = useSwitchCharacter();
  
  const getCurrentBgKey = () => {
    if (!bgUrlContext?.backgroundUrl) return [];
    const currentBgUrl = bgUrlContext.backgroundUrl;
    if (currentBgUrl.startsWith('/bg/')) {
      return [currentBgUrl]; 
    }
    return [];
  };
  
  const [settings, setSettings] = useState<GeneralSettings>({
    language: ['en'],
    customBgUrl: !bgUrlContext?.backgroundUrl?.startsWith('/bg/') ? bgUrlContext?.backgroundUrl || '' : '',
    selectedBgUrl: getCurrentBgKey(),
    backgroundUrl: bgUrlContext?.backgroundUrl || '',
    selectedCharacterPreset: []
  });

  const [originalSettings, setOriginalSettings] = useState<GeneralSettings>({
    language: ["en"],
    customBgUrl: !bgUrlContext?.backgroundUrl?.startsWith("/bg/")
      ? bgUrlContext?.backgroundUrl || ""
      : "",
    selectedBgUrl: getCurrentBgKey(),
    backgroundUrl: bgUrlContext?.backgroundUrl || "",
    selectedCharacterPreset: [],
  });

  useEffect(() => {
    if (confName) {
      const initialSettings = {
        ...settings,
        selectedCharacterPreset: [confName]
      };
      setSettings(initialSettings);
      setOriginalSettings(initialSettings);
    }
  }, []);

  useEffect(() => {
    if (confName) {
      const newSettings = {
        ...settings,
        selectedCharacterPreset: [confName]
      };
      setSettings(newSettings);
      setOriginalSettings(newSettings);
    }
  }, [confName]);

  const handleSave = () => {
    const newBgUrl = settings.customBgUrl || settings.selectedBgUrl[0];
    if (newBgUrl && bgUrlContext) {
      setOriginalSettings({...settings});
    }
  };

  const handleCancel = () => {
    console.log('handleCancel');
    setSettings(originalSettings);
    if (bgUrlContext && originalSettings.backgroundUrl) {
      bgUrlContext.setBackgroundUrl(originalSettings.backgroundUrl);
    }
  };

  const handleSettingChange = (key: keyof GeneralSettings, value: GeneralSettings[keyof GeneralSettings]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const newBgUrl = settings.customBgUrl || settings.selectedBgUrl[0];
    if (newBgUrl && bgUrlContext) {
      bgUrlContext.setBackgroundUrl(newBgUrl);
    }
  }, [settings.selectedBgUrl, settings.customBgUrl, bgUrlContext]);

  useEffect(() => {
    if (!onSave || !onCancel) return;

    const cleanupSave = onSave(() => {
      console.log('Saving general settings...');
      handleSave();
    });

    const cleanupCancel = onCancel(() => {
      console.log('Canceling general settings...');
      handleCancel();
    });

    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel]);

  const languages = createListCollection({
    items: [
      { label: "English", value: "en" },
      { label: "中文", value: "zh" },
    ],
  });

  const backgroundCollection = createListCollection({ 
    items: bgUrlContext?.backgroundFiles.map(filename => ({
      label: String(filename),
      value: `/bg/${filename}`
    })) || []
  });

  const characterPresetCollection = createListCollection({
    items: Object.keys(configFiles).map(name => ({
      label: name,
      value: name,
    }))
  });

  const handleCharacterPresetChange = (value: string[]) => {
    const selectedPreset = value[0];
    if (selectedPreset && selectedPreset !== confName) {
      switchCharacter(selectedPreset);
      handleSettingChange("selectedCharacterPreset", value);
    }
  };

  return (
    <Stack {...settingStyles.general.container}>
      <SelectField
        label="Language"
        value={settings.language}
        onChange={(value) => handleSettingChange("language", value)}
        collection={languages}
        placeholder="Select language"
      />

      <SelectField
        label="Background Image"
        value={settings.selectedBgUrl}
        onChange={(value) => handleSettingChange("selectedBgUrl", value)}
        collection={backgroundCollection}
        placeholder="Select from available backgrounds"
      />

      <Field
        {...settingStyles.general.field}
        label={
          <Text {...settingStyles.general.field.label}>
            Or enter a custom background URL
          </Text>
        }
      >
        <Input
          {...settingStyles.general.input}
          placeholder="Enter image URL"
          value={settings.customBgUrl}
          onChange={(e) => handleSettingChange("customBgUrl", e.target.value)}
        />
      </Field>

      <SelectField
        label="Character Preset"
        value={settings.selectedCharacterPreset}
        onChange={handleCharacterPresetChange}
        collection={characterPresetCollection}
        placeholder={confName || "Select character preset"}
      />
    </Stack>
  );
}

export default General; 