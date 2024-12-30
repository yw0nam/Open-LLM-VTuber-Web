import { useRef } from 'react'
import { useAiState } from '@/context/ai-state-context'
import { useSubtitle } from '@/context/subtitle-context'
import { useResponse } from '@/context/response-context'
import { useChatHistory } from '@/context/chat-history-context'
import { audioTaskQueue } from '@/utils/task-queue'
import { useLive2DModel } from '@/context/live2d-model-context'

interface AudioTaskOptions {
  audio_base64: string
  volumes: number[]
  slice_length: number
  text?: string | null
  expression_list?: string[] | null
}

export const useAudioTask = () => {
  const { aiState } = useAiState()
  const { setSubtitleText } = useSubtitle()
  const { appendResponse } = useResponse()
  const { appendAIMessage } = useChatHistory()
  const { currentModel } = useLive2DModel()
  
  const stateRef = useRef({
    aiState,
    currentModel,
    setSubtitleText,
    appendResponse,
    appendAIMessage
  })

  stateRef.current = {
    aiState,
    currentModel,
    setSubtitleText,
    appendResponse,
    appendAIMessage
  }

  const handleAudioPlayback = (options: AudioTaskOptions, onComplete: () => void) => {
    const { aiState, currentModel, setSubtitleText, appendResponse, appendAIMessage } = stateRef.current

    if (aiState === 'interrupted') {
      console.error('Audio playback blocked. State:', aiState)
      onComplete()
      return
    }

    const { audio_base64, text, expression_list } = options

    if (text) {
      appendResponse(text)
      appendAIMessage(text)
      setSubtitleText(text)
    }

    if (!currentModel) {
      console.error('Model not initialized')
      onComplete()
      return
    }

    try {
      currentModel.speak('data:audio/wav;base64,' + audio_base64, {
        expression: expression_list?.[0] || undefined,
        resetExpression: true,
        onFinish: () => {
          console.log('Voiceline is over')
          onComplete()
        },
        onError: (error) => {
          console.error('Audio playback error:', error)
          onComplete()
        }
      })
    } catch (error) {
      console.error('Speak function error:', error)
      onComplete()
    }
  }

  const addAudioTask = async (options: AudioTaskOptions) => {
    const { aiState } = stateRef.current
    
    if (aiState === 'interrupted') {
      console.log('Skipping audio task due to interrupted state')
      return
    }

    console.log(`Adding audio task ${options.text} to queue`)

    audioTaskQueue.addTask(() =>
      new Promise<void>((resolve) => {
        handleAudioPlayback(options, resolve)
      }).catch((error) => {
        console.log('Audio task error:', error)
      })
    )
  }

  return {
    addAudioTask,
    appendResponse
  }
} 