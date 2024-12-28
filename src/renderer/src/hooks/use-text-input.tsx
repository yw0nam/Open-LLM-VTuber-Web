import { useState } from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useInterrupt } from '@/components/canvas/live2d';
import { audioTaskQueue } from '@/utils/task-queue';
import { useChatHistory } from '@/context/chat-history-context';

export function useTextInput() {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const wsContext = useWebSocket();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();
  const { appendHumanMessage } = useChatHistory();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || !wsContext) return;
    if (aiState == 'thinking-speaking') {
        interrupt();
    }
    appendHumanMessage(inputValue.trim());
    wsContext.sendMessage({
      type: 'text-input',
      text: inputValue.trim()
    });
    setInputValue('');
    audioTaskQueue.clearQueue();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  return {
    inputValue,
    handleInputChange,
    handleSubmit,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
  };
}
