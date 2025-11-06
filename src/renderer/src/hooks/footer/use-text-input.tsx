import { useState } from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useInterrupt } from '@/components/canvas/live2d';
import { useChatHistory } from '@/context/chat-history-context';
import { useVAD } from '@/context/vad-context';
import { useMediaCapture } from '@/hooks/utils/use-media-capture';
import { useSession } from '@/context/session-context';
import { formatMessage } from '@/services/message-formatter';
import { toaster } from '@/components/ui/toaster';

export function useTextInput() {
  const [inputText, setInputText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const wsContext = useWebSocket();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();
  const { appendHumanMessage } = useChatHistory();
  const { stopMic, autoStopMic } = useVAD();
  const { captureAllMedia } = useMediaCapture();
  const { userId, agentId, sessionId } = useSession();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !wsContext) return;
    if (aiState === 'thinking-speaking') {
      interrupt();
    }

    const capturedImages = await captureAllMedia();
    // Extract image data strings from ImageData objects
    const images = capturedImages.map(img => img.data);

    try {
      // Format message using the message formatter
      const formattedMessage = formatMessage(
        {
          text: inputText.trim(),
          images: images.length > 0 ? images : undefined,
        },
        {
          userId,
          agentId,
          sessionId: sessionId || undefined,
        }
      );

      // Send formatted message via WebSocket
      appendHumanMessage(inputText.trim());
      wsContext.sendMessage(formattedMessage);

      if (autoStopMic) stopMic();
      setInputText('');
    } catch (error) {
      // Handle formatting error
      console.error('Failed to format message:', error);
      toaster.create({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
        duration: 3000,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    if (e.key === 'Enter' && !e.shiftKey) {
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
