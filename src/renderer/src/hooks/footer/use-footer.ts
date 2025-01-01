import { useVAD } from '@/context/vad-context'
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
  const { startMic } = useVAD();
  const { handleMicToggle, micOn } = useMicToggle()

  const handleInterrupt = () => {
    interrupt();
    startMic();
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