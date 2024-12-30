import { useTextInput } from '@/hooks/footer/use-text-input'
import { useInterrupt } from '@/hooks/utils/use-interrupt'
import { useMicToggle } from '@/hooks/utils/use-mic-toggle'

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