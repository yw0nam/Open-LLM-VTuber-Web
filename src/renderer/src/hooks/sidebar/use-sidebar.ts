import { useDisclosure } from "@chakra-ui/react";
import { useInterrupt } from "@/components/canvas/live2d";
import { useChatHistory } from "@/context/chat-history-context";
import { useMode } from "@/context/mode-context";

export const useSidebar = () => {
  const disclosure = useDisclosure();
  const { interrupt } = useInterrupt();
  const { createNewSession } = useChatHistory();
  const { setMode, mode, isElectron } = useMode();

  const createNewHistory = (): void => {
    // Interrupt any ongoing conversation
    interrupt();
    
    // Create a new session (clears UI state)
    // Backend will auto-create session when user sends first message
    createNewSession();
  };

  return {
    settingsOpen: disclosure.open,
    onSettingsOpen: disclosure.onOpen,
    onSettingsClose: disclosure.onClose,
    createNewHistory,
    setMode,
    currentMode: mode,
    isElectron,
  };
};
