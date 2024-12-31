import { useEffect, useState } from 'react';
import { wsService } from '@/services/websocket-service';
import { WebSocketContext } from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useL2D } from '@/context/setting/live2d-context';
import { useSubtitle } from '@/context/subtitle-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { useResponse } from '@/context/response-context';
import { useAudioTask } from '@/components/canvas/live2d';
import { useBgUrl } from '@/context/setting/bgurl-context';
import { useCharacter } from '@/context/setting/character-context';
import { useChatHistory } from '@/context/chat-history-context';
import { toaster } from "@/components/ui/toaster";
import { HistoryInfo } from '@/context/websocket-context';
import { useVAD } from '@/context/vad-context';
import { MessageEvent } from '@/services/websocket-service';
import { wsUrl, baseUrl } from '@/context/websocket-context';

function WebSocketHandler({ children }: { children: React.ReactNode }) {
  const [wsState, setWsState] = useState<string>('CLOSED');
  const { aiState, setAiState } = useAiState();
  const { setModelInfo } = useL2D();
  const { setSubtitleText } = useSubtitle();
  const { clearResponse } = useResponse();
  const { addAudioTask } = useAudioTask();
  const bgUrlContext = useBgUrl();
  const { 
    setConfName, 
    setConfUid, 
    setConfigFiles, 
    setCharacterSchema, 
    setSystemSchema, 
    setLlmSchema, 
    setAsrSchema, 
    setTtsSchema, 
    setTranslatorSchema,
    setSystemValues,
    setCharacterValues,
    setLlmValues,
    setAsrValues,
    setTtsValues,
    setTranslatorValues
  } = useCharacter();
  const { setCurrentHistoryUid, setMessages, setHistoryList, appendHumanMessage } = useChatHistory();
  const { startMic, stopMic } = useVAD();

  useEffect(() => {
    const stateSubscription = wsService.onStateChange(setWsState);
    const messageSubscription = wsService.onMessage(handleWebSocketMessage);

    wsService.connect(wsUrl);

    return () => {
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, []);

  const handleControlMessage = (controlText: string) => {
    switch (controlText) {
      case 'start-mic':
        console.log("Starting microphone...");
        startMic();
        break;
      case 'stop-mic':
        console.log("Stopping microphone...");
        stopMic();
        break;
      case 'conversation-chain-start':
        setAiState('thinking-speaking');
        audioTaskQueue.clearQueue();
        clearResponse();
        break;
      case 'conversation-chain-end':
        audioTaskQueue.addTask(() =>
          new Promise<void>((resolve) => {
            setAiState('idle');
            startMic();
            resolve();
          })
        );
        break;
      default:
        console.warn('Unknown control command:', controlText);
    }
  };

  const handleWebSocketMessage = (message: MessageEvent) => {
    console.log('Received message from server:', message);
    switch (message.type) {
      case "control":
        if (message.text) {
          handleControlMessage(message.text);
        }
        break;
      case "set-model":
        console.log("set-model: ", message.model_info);
        if (message.model_info && !message.model_info.url.startsWith("http")) {
          const modelUrl = baseUrl + message.model_info.url; // model_info.url must begin with /
          message.model_info.url = modelUrl;
        }
        setAiState("loading");
        setModelInfo(message.model_info);
        setAiState("idle");
        break;
      case "full-text":
        if (message.text) {
          setSubtitleText(message.text);
        }
        break;
      case "config-files":
        if (message.configs) {
          setConfigFiles(message.configs);
        }
        break;
      case "config-switched":
        setAiState("idle");
        startMic();

        toaster.create({
          title: "Character switched",
          type: "success",
          duration: 2000,
        });

        wsService.sendMessage({ type: "fetch-conf-schemas" });
        wsService.sendMessage({ type: "fetch-history-list" });
        wsService.sendMessage({ type: "create-new-history" });
        break;
      case "background-files":
        if (message.files) {
          bgUrlContext?.setBackgroundFiles(message.files);
        }
        break;
      case "audio":
        // sendMessage({
        //   type: "fetch-history-list",
        // });
        if (aiState === "interrupted") {
          console.log("Audio playback intercepted. Sentence:", message.text);
        } else {
          addAudioTask({
            audio_base64: message.audio || "",
            volumes: message.volumes || [],
            slice_length: message.slice_length || 0,
            text: message.text || null,
            expression_list: message.expressions || null,
          });
        }
        break;
      case "conf-schemas":
        if (message.schemas) {
          setConfName(message.schemas.character_config.current_values.conf_name);
          setConfUid(message.schemas.character_config.current_values.conf_uid);
          
          setCharacterSchema(message.schemas.character_config.schema);
          setSystemSchema(message.schemas.system_config.schema);
          setLlmSchema(message.schemas.llm_config.schema);
          setAsrSchema(message.schemas.asr_config.schema);
          setTtsSchema(message.schemas.tts_config.schema);
          
          setCharacterValues(message.schemas.character_config.current_values);
          setSystemValues(message.schemas.system_config.current_values);
          setLlmValues(message.schemas.llm_config.current_values);
          setAsrValues(message.schemas.asr_config.current_values);
          setTtsValues(message.schemas.tts_config.current_values);
          
          if (message.schemas.translator_config) {
            setTranslatorSchema(message.schemas.translator_config.schema);
            setTranslatorValues(message.schemas.translator_config.current_values);
          }
        }
        break;
      case "history-data":
        if (message.messages) {
          setMessages(message.messages);
        }
        toaster.create({
          title: "History loaded",
          type: "success",
          duration: 2000,
        });
        break;
      case "new-history-created":
        if (message.history_uid) {
          setCurrentHistoryUid(message.history_uid);
          setMessages([]);
          const newHistory: HistoryInfo = {
            uid: message.history_uid,
            latest_message: null,
            timestamp: new Date().toISOString(),
          };
          setHistoryList((prev: HistoryInfo[]) => [newHistory, ...prev]);
          toaster.create({
            title: "New chat history created",
            type: "success",
            duration: 2000,
          });
        }
        break;
      case "history-deleted":
        toaster.create({
          title: message.success
            ? "History deleted successfully"
            : "Failed to delete history",
          type: message.success ? "success" : "error",
          duration: 2000,
        });
        break;
      case "history-list":
        if (message.histories) {
          setHistoryList(message.histories);
          if (message.histories.length > 0) {
            setCurrentHistoryUid(message.histories[0].uid);
          }
        }
        break;
      case "user-input-transcription":
        console.log("user-input-transcription: ", message.text);
        if (message.text) {
          appendHumanMessage(message.text);
        }
        break;
      case "error":
        toaster.create({
          title: message.message,
          type: "error",
          duration: 2000,
        });
        break;
      default:
        console.warn("Unknown message type:", message.type);
    }
  };

  const webSocketContextValue = {
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState,
    reconnect: () => wsService.connect(wsUrl),
  };

  return (
    <WebSocketContext.Provider value={webSocketContextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketHandler;
