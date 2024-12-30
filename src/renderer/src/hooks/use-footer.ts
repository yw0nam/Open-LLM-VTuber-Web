import { useTextInput } from './use-text-input'
import { useInterrupt } from '@/components/canvas/live2d'
import { useMicToggle } from './use-mic-toggle'

export const useFooter = () => {
  const {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd
  } = useTextInput()
  
  const { interrupt } = useInterrupt()
  const { handleMicToggle, micOn } = useMicToggle()

  return {
    inputValue,
    handleInputChange,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    interrupt,
    handleMicToggle,
    micOn
  }
} 