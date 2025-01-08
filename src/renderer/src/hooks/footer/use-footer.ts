import { useVAD } from '@/context/vad-context'
import { useTextInput } from "@/hooks/footer/use-text-input";
import { useInterrupt } from '@/hooks/utils/use-interrupt'
import { useMicToggle } from '@/hooks/utils/use-mic-toggle'
import { ChangeEvent, KeyboardEvent } from 'react'
import { useAiState, AiStateEnum } from '@/context/ai-state-context'

export const useFooter = () => {
  const {
    inputText: inputValue,
    setInputText: handleChange,
    handleKeyPress: handleKey,
    handleCompositionStart,
    handleCompositionEnd
  } = useTextInput()
  
  const { interrupt } = useInterrupt()
  const { startMic } = useVAD()
  const { handleMicToggle, micOn } = useMicToggle()
  const { setAiState } = useAiState()

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    handleChange({ target: { value: e.target.value } } as ChangeEvent<HTMLInputElement>)
    setAiState(AiStateEnum.WAITING)
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    handleKey(e as any)
  }

  const handleInterrupt = () => {
    interrupt()
    startMic()
  }

  return {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    handleInterrupt,
    handleMicToggle,
    micOn
  }
} 