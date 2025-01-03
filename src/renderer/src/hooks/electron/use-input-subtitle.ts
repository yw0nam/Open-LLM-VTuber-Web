import { useState } from 'react'
import { useChatHistory } from '@/context/chat-history-context'
import { useWebSocket } from '@/context/websocket-context'
import { useAiState } from '@/context/ai-state-context'
import { useInterrupt } from '@/components/canvas/live2d'
import { useVAD } from '@/context/vad-context'
import { useMicToggle } from '@/hooks/utils/use-mic-toggle'

export function useInputSubtitle() {
  const [inputText, setInputText] = useState("")
  const [isComposing, setIsComposing] = useState(false)

  // Get necessary context hooks
  const { messages, appendHumanMessage } = useChatHistory()
  const wsContext = useWebSocket()
  const { aiState } = useAiState()
  const { interrupt } = useInterrupt()
  const { stopMic, startMic, voiceInterruptionOn } = useVAD()
  const { handleMicToggle, micOn } = useMicToggle()

  // Get the last AI message
  const lastAIMessage = messages
    .filter(msg => msg.role === 'ai')
    .slice(-1)
    .map(msg => msg.content)[0]

  const hasAIMessages = messages.some(msg => msg.role === 'ai')

  const handleSend = () => {
    if (!inputText.trim() || !wsContext) return
    
    if (aiState === 'thinking-speaking') {
      interrupt()
    }
    
    appendHumanMessage(inputText.trim())
    wsContext.sendMessage({
      type: 'text-input',
      text: inputText.trim()
    })
    
    if (!voiceInterruptionOn) stopMic()
    setInputText("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (isComposing) return

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCompositionStart = () => setIsComposing(true)
  const handleCompositionEnd = () => setIsComposing(false)

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