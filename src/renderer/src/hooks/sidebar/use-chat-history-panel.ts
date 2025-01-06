import { useRef, useCallback } from 'react'
import { useChatHistory } from '@/context/chat-history-context'
import { Message } from '@/types/message'

export function useChatHistoryPanel() {
  const { messages } = useChatHistory()
  const messageListRef = useRef<HTMLDivElement>(null)

  const handleMessageUpdate = useCallback((message: Message) => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [])

  return {
    messages,
    messageListRef,
    handleMessageUpdate
  }
} 