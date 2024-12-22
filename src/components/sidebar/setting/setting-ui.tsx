import {
  Tabs,
  Button,
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerBody,
  DrawerFooter,
  DrawerBackdrop,
  DrawerCloseTrigger,
} from '@chakra-ui/react';
import { CloseButton } from "@/components/ui/close-button";


import { settingStyles } from './setting-styles';
import General from './general';
import Live2d from './live2d';
import ASR from './asr';
import TTS from './tts';
import LLM from './llm';
import About from './about';
import { useState } from 'react';

interface SettingUIProps {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
}

function SettingUI({ open, onClose }: SettingUIProps) {
  const [saveHandlers, setSaveHandlers] = useState<(() => void)[]>([]);
  const [cancelHandlers, setCancelHandlers] = useState<(() => void)[]>([]);

  const handleSaveCallback = (handler: () => void) => {
    setSaveHandlers(prev => [...prev, handler]);
    return () => {
      setSaveHandlers(prev => prev.filter(h => h !== handler));
    };
  };

  const handleCancelCallback = (handler: () => void) => {
    setCancelHandlers(prev => [...prev, handler]);
    return () => {
      setCancelHandlers(prev => prev.filter(h => h !== handler));
    };
  };

  const handleSave = () => {
    saveHandlers.forEach(handler => handler());
    onClose();
  };

  const handleCancel = () => {
    cancelHandlers.forEach(handler => handler());
    onClose();
  };

  return (
    <DrawerRoot
      open={open}
      onOpenChange={(e) => (e.open ? null : onClose())}
      placement="start"
    >
      <DrawerBackdrop />
      <DrawerContent {...settingStyles.settingUI.drawerContent}>
        <DrawerHeader {...settingStyles.settingUI.drawerHeader}>
          <DrawerTitle {...settingStyles.settingUI.drawerTitle}>Settings</DrawerTitle>
          <div {...settingStyles.settingUI.closeButton}>
            <DrawerCloseTrigger asChild onClick={handleCancel}>
              <CloseButton size="sm" color="white" />
            </DrawerCloseTrigger>
          </div>
        </DrawerHeader>

        <DrawerBody>
          <Tabs.Root
            defaultValue="general"
            {...settingStyles.settingUI.tabs.root}
          >
            <Tabs.List>
              <Tabs.Trigger
                value="general"
                {...settingStyles.settingUI.tabs.trigger}
              >
                General
              </Tabs.Trigger>
              <Tabs.Trigger
                value="live2d"
                {...settingStyles.settingUI.tabs.trigger}
              >
                Live2d
              </Tabs.Trigger>
              <Tabs.Trigger
                value="asr"
                {...settingStyles.settingUI.tabs.trigger}
              >
                ASR
              </Tabs.Trigger>
              <Tabs.Trigger
                value="tts"
                {...settingStyles.settingUI.tabs.trigger}
              >
                TTS
              </Tabs.Trigger>
              <Tabs.Trigger
                value="llm"
                {...settingStyles.settingUI.tabs.trigger}
              >
                LLM
              </Tabs.Trigger>
              <Tabs.Trigger
                value="about"
                {...settingStyles.settingUI.tabs.trigger}
              >
                About
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.ContentGroup>
              <Tabs.Content
                value="general"
                {...settingStyles.settingUI.tabs.content}
              >
                <General
                  onSave={handleSaveCallback}
                  onCancel={handleCancelCallback}
                />
              </Tabs.Content>
              <Tabs.Content
                value="live2d"
                {...settingStyles.settingUI.tabs.content}
              >
                <Live2d
                  onSave={handleSaveCallback}
                  onCancel={handleCancelCallback}
                />
              </Tabs.Content>
              <Tabs.Content
                value="asr"
                {...settingStyles.settingUI.tabs.content}
              >
                <ASR 
                  onSave={handleSaveCallback}
                  onCancel={handleCancelCallback}
                />
              </Tabs.Content>
              <Tabs.Content
                value="tts"
                {...settingStyles.settingUI.tabs.content}
              >
                <TTS />
              </Tabs.Content>
              <Tabs.Content
                value="llm"
                {...settingStyles.settingUI.tabs.content}
              >
                <LLM />
              </Tabs.Content>
              <Tabs.Content
                value="about"
                {...settingStyles.settingUI.tabs.content}
              >
                <About />
              </Tabs.Content>
            </Tabs.ContentGroup>
          </Tabs.Root>
        </DrawerBody>

        <DrawerFooter>
          <Button colorPalette="red" onClick={handleCancel}>
            Cancel
          </Button>
          <Button colorPalette="blue" onClick={handleSave}>
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  );
}

export default SettingUI;
