import React, { createContext, useContext, useEffect, useState } from "react";
import { MicVAD } from "@ricky0123/vad-web";
import { useInterrupt } from "@/components/canvas/live2d";
import { audioTaskQueue } from "@/utils/task-queue";
import { useSendAudio } from "@/hooks/use-send-audio";
import { SubtitleContext } from "./subtitle-context";
import { AiStateContext } from "./ai-state-context";

interface VADContextProps {
  vad: MicVAD | null;
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
  const [vad, setVad] = useState<MicVAD | null>(null);
  const [previousTriggeredProbability, setPreviousTriggeredProbability] =
    useState(0);
  const [voiceInterruptionOn, setVoiceInterruptionOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const { interrupt } = useInterrupt();
  const { sendAudioPartition } = useSendAudio();
  const { setSubtitleText } = useContext(SubtitleContext)!;
  const { aiState, setAiState } = useContext(AiStateContext)!;
  const [settings, setSettings] = useState<VADSettings>({
    positiveSpeechThreshold: 97,
    negativeSpeechThreshold: 15,
    redemptionFrames: 20,
  });

  useEffect(() => {
    return () => {
      if (vad) {
        vad.pause();
      }
    };
  }, [vad]);

  const updateSettings = (newSettings: VADSettings) => {
    setSettings(newSettings);
    if (vad) {
      stopMic();
      setTimeout(() => {
        startMic();
      }, 100);
    }
  };

  const initVAD = async () => {
    const newVAD = await MicVAD.new({
      preSpeechPadFrames: 20,
      positiveSpeechThreshold: settings.positiveSpeechThreshold / 100,
      negativeSpeechThreshold: settings.negativeSpeechThreshold / 100,
      redemptionFrames: settings.redemptionFrames,

      onSpeechStart: () => {
        console.log("VAD start");
        if (aiState === "thinking-speaking") {
          interrupt();
        }
      },
      onFrameProcessed: (probs) => {
        if (probs.isSpeech > previousTriggeredProbability) {
          setPreviousTriggeredProbability(probs.isSpeech);
        }
      },
      onSpeechEnd: (audio: Float32Array) => {
        console.log("VAD end");
        audioTaskQueue.clearQueue();
        if (!voiceInterruptionOn) {
          stopMic();
        }
        setPreviousTriggeredProbability(0);
        sendAudioPartition(audio);
      },
      onVADMisfire: () => {
        console.log("VAD misfire");
        setPreviousTriggeredProbability(0);
        if (aiState === "interrupted") {
          setAiState("idle");
        }
        setSubtitleText("The LLM can't hear you.");
      },
    });
    setVad(newVAD);
    await newVAD.start();
  };

  const startMic = async () => {
    console.log("VAD start");
    try {
      if (!vad) {
        await initVAD();
      } else {
        await vad.start();
      }
    } catch (error) {
      console.error("Failed to start VAD:", error);
    }
    setMicOn(true);
  };

  const stopMic = () => {
    console.log("VAD stop");
    if (vad) {
      vad.pause();
      setPreviousTriggeredProbability(0);
    }
    setMicOn(false);
  };

  return (
    <VADContext.Provider
      value={{
        vad,
        startMic,
        stopMic,
        voiceInterruptionOn,
        setVoiceInterruptionOn,
        previousTriggeredProbability,
        setPreviousTriggeredProbability,
        micOn,
        setMicOn,
        settings,
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
