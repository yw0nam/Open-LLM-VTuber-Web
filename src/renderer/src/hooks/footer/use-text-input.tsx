import { useState } from "react";
import { useWebSocket } from "@/context/websocket-context";
import { useAiState } from "@/context/ai-state-context";
import { useInterrupt } from "@/components/canvas/live2d";
import { useChatHistory } from "@/context/chat-history-context";
import { useVAD } from "@/context/vad-context";
import { useMediaCapture } from "@/hooks/utils/use-media-capture";
import { useConfig } from "@/context/character-config-context";

export function useTextInput() {
  const [inputText, setInputText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const wsContext = useWebSocket();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();
  const { addUserMessageToUI } = useChatHistory();
  const { stopMic, autoStopMic } = useVAD();
  const { captureAllMedia } = useMediaCapture();
  const { personaPrompt } = useConfig();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !wsContext) return;
    if (aiState === "thinking-speaking") {
      interrupt();
    }

    const images = await captureAllMedia();

    // Optimistically add user message to UI
    addUserMessageToUI(inputText.trim());
    
    // Send message via WebSocket (backend handles persistence)
    wsContext.sendMessage({
      type: "chat_message",
      content: inputText.trim(),
      agent_id: localStorage.getItem("agent_id") || "default-agent",
      user_id: localStorage.getItem("user_id") || "default-user",
      images,
      limit: 10,
      persona: personaPrompt || undefined,
    });

    if (autoStopMic) stopMic();
    setInputText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  return {
    inputText,
    setInputText: handleInputChange,
    handleSend,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
  };
}
