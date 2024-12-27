import { createContext, useContext, useRef, useCallback, useEffect, useReducer } from "react";
import { MicVAD } from "@ricky0123/vad-web";
import { useInterrupt } from "@/components/canvas/live2d";
import { audioTaskQueue } from "@/utils/task-queue";
import { useSendAudio } from "@/hooks/use-send-audio";
import { SubtitleContext } from "./subtitle-context";
import { AiStateContext } from "./ai-state-context";

interface VADContextProps {
  voiceInterruptionOn: boolean;
  micOn: boolean;
  setMicOn: (value: boolean) => void;
  setVoiceInterruptionOn: (value: boolean) => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
  previousTriggeredProbability: number;
  setPreviousTriggeredProbability: (value: number) => void;
  settings: VADSettings;
  updateSettings: (newSettings: VADSettings) => void;
}

export const VADContext = createContext<VADContextProps | undefined>(undefined);

interface VADSettings {
  positiveSpeechThreshold: number;
  negativeSpeechThreshold: number;
  redemptionFrames: number;
}

export const VADProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const vadRef = useRef<MicVAD | null>(null);
  const previousTriggeredProbabilityRef = useRef(0);
  const voiceInterruptionOnRef = useRef(false);
  const micOnRef = useRef(true);
  const settingsRef = useRef<VADSettings>({
    positiveSpeechThreshold: 97,
    negativeSpeechThreshold: 15,
    redemptionFrames: 20,
  });

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const { interrupt } = useInterrupt();
  const { sendAudioPartition } = useSendAudio();
  const { setSubtitleText } = useContext(SubtitleContext)!;
  const { aiState, setAiState } = useContext(AiStateContext)!;

  const interruptRef = useRef(interrupt);
  const sendAudioPartitionRef = useRef(sendAudioPartition);
  const aiStateRef = useRef<string>(aiState);
  const setSubtitleTextRef = useRef(setSubtitleText);
  const setAiStateRef = useRef(setAiState);

  useEffect(() => {
    aiStateRef.current = aiState;
  }, [aiState]);

  useEffect(() => {
    interruptRef.current = interrupt;
  }, [interrupt]);

  useEffect(() => {
    sendAudioPartitionRef.current = sendAudioPartition;
  }, [sendAudioPartition]);

  useEffect(() => {
    setSubtitleTextRef.current = setSubtitleText;
  }, [setSubtitleText]);

  useEffect(() => {
    setAiStateRef.current = setAiState;
  }, [setAiState]);

  const setPreviousTriggeredProbability = (value: number) => {
    previousTriggeredProbabilityRef.current = value;
    forceUpdate();
  };

  const setVoiceInterruptionOn = (value: boolean) => {
    voiceInterruptionOnRef.current = value;
    forceUpdate();
  };

  const setMicOn = (value: boolean) => {
    micOnRef.current = value;
    forceUpdate();
  };

  const handleSpeechStart = useCallback(() => {
    console.log("onSpeechStart");
    if (aiStateRef.current === "thinking-speaking") {
      interruptRef.current();
    }
  }, []);

  const handleFrameProcessed = useCallback((probs: { isSpeech: number }) => {
    if (probs.isSpeech > previousTriggeredProbabilityRef.current) {
      setPreviousTriggeredProbability(probs.isSpeech);
    }
  }, []);

  const handleSpeechEnd = useCallback((audio: Float32Array) => {
    console.log("onSpeechEnd");
    audioTaskQueue.clearQueue();
    if (!voiceInterruptionOnRef.current) {
      stopMic();
    }
    else console.log("voice interruption is on, not stopping mic");
    setPreviousTriggeredProbability(0);
    sendAudioPartitionRef.current(audio);
  }, []);

  const handleVADMisfire = useCallback(() => {
    console.log("onVADMisfire");
    setPreviousTriggeredProbability(0);
    if (aiStateRef.current === "interrupted") {
      setAiStateRef.current("idle");
    }
    setSubtitleTextRef.current("The LLM can't hear you.");
  }, []);

  const updateSettings = useCallback((newSettings: VADSettings) => {
    settingsRef.current = newSettings;
    forceUpdate();
    if (vadRef.current) {
      stopMic();
      setTimeout(() => {
        startMic();
      }, 100);
    }
  }, []);

  const initVAD = async () => {
    // The initVad is a closure. So I use the ref to avoid the closure issue. It's a little bit ugly. I don't know how to fix it in a better way.
    const newVAD = await MicVAD.new({
      preSpeechPadFrames: 20,
      positiveSpeechThreshold: settingsRef.current.positiveSpeechThreshold / 100,
      negativeSpeechThreshold: settingsRef.current.negativeSpeechThreshold / 100,
      redemptionFrames: settingsRef.current.redemptionFrames,

      onSpeechStart: handleSpeechStart,
      onFrameProcessed: handleFrameProcessed,
      onSpeechEnd: handleSpeechEnd,
      onVADMisfire: handleVADMisfire,
    });
    vadRef.current = newVAD;
    newVAD.start();
  };

  const startMic = async () => {
    try {
      if (!vadRef.current) {
        console.log("VAD init");
        await initVAD();
      } else {
        console.log("VAD start");
        vadRef.current.start();
      }
    } catch (error) {
      console.error("Failed to start VAD:", error);
    }
    setMicOn(true);
  };

  const stopMic = () => {
    console.log("VAD stop");
    if (vadRef.current) {
      vadRef.current.pause();
      console.log("vad.pause() completed");
      setPreviousTriggeredProbability(0);
    }
    else console.log("vad is null");
    setMicOn(false);
  };

  return (
    <VADContext.Provider
      value={{
        startMic,
        stopMic,
        voiceInterruptionOn: voiceInterruptionOnRef.current,
        setVoiceInterruptionOn,
        previousTriggeredProbability: previousTriggeredProbabilityRef.current,
        setPreviousTriggeredProbability,
        micOn: micOnRef.current,
        setMicOn,
        settings: settingsRef.current,
        updateSettings,
      }}
    >
      {children}
    </VADContext.Provider>
  );
};

export const useVAD = () => {
  const context = useContext(VADContext);
  if (!context) {
    throw new Error("useVAD must be used within a VADProvider");
  }
  return context;
};
