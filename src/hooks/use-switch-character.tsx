import { useWebSocket } from '@/context/websocket-context';
import { useConfig } from '@/context/config-context';
import { useCallback } from 'react';
import { toaster } from "@/components/ui/toaster";
import { useInterrupt } from '@/components/canvas/live2d';
import { useVAD } from '@/context/vad-context';

export function useSwitchCharacter() {
  const { sendMessage } = useWebSocket();
  const { configFiles } = useConfig();
  const { interrupt } = useInterrupt();
  const { stopMic } = useVAD();
  const switchCharacter = useCallback((characterName: string) => {
    const fileName = configFiles[characterName];
    if (!fileName) {
      toaster.create({
        title: 'Error',
        description: `Character preset "${characterName}" not found`,
        type: 'error',
        duration: 2000,
      });
      return;
    }

    interrupt();
    stopMic();

    sendMessage({
      type: "switch-config",
      file: fileName
    });

    console.log("switchCharacter", characterName, fileName);
  }, [configFiles, sendMessage]);

  return { switchCharacter };
}
