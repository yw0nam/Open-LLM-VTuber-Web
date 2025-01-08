import { useVAD } from '@/context/vad-context';

export function useMicToggle() {
  const { startMic, stopMic, micOn } = useVAD();

  const handleMicToggle = async (): Promise<void> => {
    if (micOn) {
      stopMic();
    } else {
      await startMic();
    }
  };

  return {
    handleMicToggle,
    micOn,
  };
}
