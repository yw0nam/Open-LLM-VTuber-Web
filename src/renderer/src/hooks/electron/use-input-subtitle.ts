import { useChatHistory } from '@/context/chat-history-context'
import { useVAD } from '@/context/vad-context'
import { useMicToggle } from '@/hooks/utils/use-mic-toggle'
import { useTextInput } from '@/hooks/footer/use-text-input'
import { useAiState } from '@/context/ai-state-context'
import { useInterrupt } from '@/hooks/utils/use-interrupt'

export function useInputSubtitle() {
  const {
    inputText,
    setInputText,
    handleSend,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd
  } = useTextInput()

  const { messages } = useChatHistory()
  const { startMic } = useVAD()
  const { handleMicToggle, micOn } = useMicToggle()
  const { aiState } = useAiState()
  const { interrupt } = useInterrupt()

  const lastAIMessage = messages
    .filter(msg => msg.role === 'ai')
    .slice(-1)
    .map(msg => msg.content)[0]

  const hasAIMessages = messages.some(msg => msg.role === 'ai')

  const handleInterrupt = () => {
    interrupt()
    startMic()
  }

  return {
    inputText,
    setInputText,
    handleSend,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    lastAIMessage,
    hasAIMessages,
    aiState,
    micOn
  }
} 