import { useRef, useEffect } from 'react'
import { useChatHistory } from '@/context/chat-history-context'

export const useChatHistoryPanel = () => {
  const { messages } = useChatHistory()
  const messageListRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [messages])

  return {
    messages,
    messageListRef
  }
} 