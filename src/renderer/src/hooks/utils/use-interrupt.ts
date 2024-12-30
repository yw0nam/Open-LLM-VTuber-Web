import { useAiState } from '@/context/ai-state-context'
import { useWebSocket } from '@/context/websocket-context'
import { useResponse } from '@/context/response-context'
import { audioTaskQueue } from '@/utils/task-queue'
import { useLive2DModel } from '@/context/live2d-model-context'

export const useInterrupt = () => {
  const { setAiState } = useAiState()
  const { sendMessage } = useWebSocket()
  const { fullResponse } = useResponse()
  const { currentModel } = useLive2DModel()

  const interrupt = () => {
    console.log('Interrupting conversation chain')
    sendMessage({
      type: 'interrupt-signal',
      text: fullResponse
    })
    setAiState('interrupted')
    
    if (currentModel) {
      currentModel.stopSpeaking()
    }
    else {
      console.error('Live2D model is not initialized')
    }
    
    audioTaskQueue.clearQueue()
    console.log('Interrupted!')
  }

  return { interrupt }
} 