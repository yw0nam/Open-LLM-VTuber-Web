import { useEffect, useState } from 'react';
import { wsService, MessageEvent } from '@/services/websocket-service';
import {
  WebSocketContext, HistoryInfo, defaultWsUrl, defaultBaseUrl,
} from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useLive2DConfig } from '@/context/live2d-config-context';
import { useSubtitle } from '@/context/subtitle-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { useAudioTask } from '@/components/canvas/live2d';
import { useBgUrl } from '@/context/bgurl-context';
import { useConfig } from '@/context/character-config-context';
import { useChatHistory } from '@/context/chat-history-context';
import { toaster } from '@/components/ui/toaster';
import { useVAD } from '@/context/vad-context';

function WebSocketHandler({ children }: { children: React.ReactNode }) {
  const [wsState, setWsState] = useState<string>('CLOSED');
  const [wsUrl, setWsUrl] = useState(defaultWsUrl);
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const { aiState, setAiState } = useAiState();
  const { setModelInfo } = useLive2DConfig();
  const { setSubtitleText } = useSubtitle();
  const { clearResponse } = useChatHistory();
  const { addAudioTask } = useAudioTask();
  const bgUrlContext = useBgUrl();
  const { setConfName, setConfUid, setConfigFiles } = useConfig();
  const {
    setCurrentHistoryUid, setMessages, setHistoryList, appendHumanMessage,
  } = useChatHistory();
  const { startMic, stopMic } = useVAD();

  useEffect(() => {
    const stateSubscription = wsService.onStateChange(setWsState);
    const messageSubscription = wsService.onMessage(handleWebSocketMessage);

    wsService.connect(wsUrl);

    return () => {
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [wsUrl]);

  const handleControlMessage = (controlText: string) => {
    switch (controlText) {
      case 'start-mic':
        console.log('Starting microphone...');
        startMic();
        break;
      case 'stop-mic':
        console.log('Stopping microphone...');
        stopMic();
        break;
      case 'conversation-chain-start':
        setAiState('thinking-speaking');
        audioTaskQueue.clearQueue();
        clearResponse();
        break;
      case 'conversation-chain-end':
        audioTaskQueue.addTask(() => new Promise<void>((resolve) => {
          setAiState('idle');
          startMic();
          resolve();
        }));
        break;
      default:
        console.warn('Unknown control command:', controlText);
    }
  };

  const handleWebSocketMessage = (message: MessageEvent) => {
    console.log('Received message from server:', message);
    switch (message.type) {
      case 'control':
        if (message.text) {
          handleControlMessage(message.text);
        }
        break;
      case 'set-model':
        console.log('set-model: ', message.model_info);
        if (message.model_info && !message.model_info.url.startsWith('http')) {
          const modelUrl = baseUrl + message.model_info.url; // model_info.url must begin with /
          message.model_info.url = modelUrl;
        }
        setAiState('loading');
        setModelInfo(message.model_info);
        setAiState('idle');
        break;
      case 'full-text':
        if (message.text) {
          setSubtitleText(message.text);
        }
        break;
      case 'config-files':
        if (message.configs) {
          setConfigFiles(message.configs);
        }
        break;
      case 'config-switched':
        setAiState('idle');
        setSubtitleText('New Character Loaded');
        startMic();

        toaster.create({
          title: 'Character switched',
          type: 'success',
          duration: 2000,
        });

        wsService.sendMessage({ type: 'fetch-conf-info' });
        wsService.sendMessage({ type: 'fetch-history-list' });
        wsService.sendMessage({ type: 'create-new-history' });
        break;
      case 'background-files':
        if (message.files) {
          bgUrlContext?.setBackgroundFiles(message.files);
        }
        break;
      case 'audio':
        if (aiState == 'interrupted' || aiState == 'listening') {
          console.log('Audio playback intercepted. Sentence:', message.text);
        } else {
          addAudioTask({
            audio_base64: message.audio || '',
            volumes: message.volumes || [],
            slice_length: message.slice_length || 0,
            text: message.text || null,
            expression_list: message.expressions || null,
          });
        }
        break;
      case 'config-info':
        if (message.conf_name) {
          setConfName(message.conf_name);
        }
        if (message.conf_uid) {
          setConfUid(message.conf_uid);
        }
        break;
      case 'history-data':
        if (message.messages) {
          setMessages(message.messages);
        }
        toaster.create({
          title: 'History loaded',
          type: 'success',
          duration: 2000,
        });
        break;
      case 'new-history-created':
        setAiState('idle');
        setSubtitleText('New Conversation Started');
        // No need to open mic here
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
            title: 'New chat history created',
            type: 'success',
            duration: 2000,
          });
        }
        break;
      case 'history-deleted':
        toaster.create({
          title: message.success
            ? 'History deleted successfully'
            : 'Failed to delete history',
          type: message.success ? 'success' : 'error',
          duration: 2000,
        });
        break;
      case 'history-list':
        if (message.histories) {
          setHistoryList(message.histories);
          if (message.histories.length > 0) {
            setCurrentHistoryUid(message.histories[0].uid);
          }
        }
        break;
      case 'user-input-transcription':
        console.log('user-input-transcription: ', message.text);
        if (message.text) {
          appendHumanMessage(message.text);
        }
        break;
      case 'error':
        toaster.create({
          title: message.message,
          type: 'error',
          duration: 2000,
        });
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  };

  const webSocketContextValue = {
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState,
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl,
    baseUrl,
    setBaseUrl,
  };

  return (
    <WebSocketContext.Provider value={webSocketContextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketHandler;
