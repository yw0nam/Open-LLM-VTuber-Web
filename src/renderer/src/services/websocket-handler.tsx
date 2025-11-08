/* eslint-disable no-sparse-arrays */
/* eslint-disable react-hooks/exhaustive-deps */
// eslint-disable-next-line object-curly-newline
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { wsService, MessageEvent, Message } from '@/services/websocket-service';
import {
  WebSocketContext, HistoryInfo, defaultWsUrl, defaultBaseUrl,
} from '@/context/websocket-context';
import { ModelInfo, useLive2DConfig } from '@/context/live2d-config-context';
import { useSubtitle } from '@/context/subtitle-context';
import { audioTaskQueue } from '@/utils/task-queue';
import { useAudioTask } from '@/components/canvas/live2d';
import { useBgUrl } from '@/context/bgurl-context';
import { useConfig } from '@/context/character-config-context';
import { useChatHistory } from '@/context/chat-history-context';
import { toaster } from '@/components/ui/toaster';
import { useVAD } from '@/context/vad-context';
import { AiState, useAiState } from "@/context/ai-state-context";
import { useLocalStorage } from '@/hooks/utils/use-local-storage';
import { useGroup } from '@/context/group-context';
import { useInterrupt } from '@/hooks/utils/use-interrupt';
import { useBrowser } from '@/context/browser-context';
import { extractVolumesFromWAV } from '@/services/audio-processor';
import { desktopMateAdapter } from '@/services/desktopmate-adapter';
import { useSession } from '@/context/session-context';
import { configManager } from '@/services/desktopmate-config';
import {
  saveMessagesToLocal,
  loadMessagesFromLocal,
  addToPendingSync,
  getPendingSync,
  removePendingSync,
  hasPendingSync,
} from '@/services/message-persistence';

function WebSocketHandler({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [wsState, setWsState] = useState<string>('CLOSED');
  const [wsUrl, setWsUrl] = useLocalStorage<string>('wsUrl', defaultWsUrl);
  const [baseUrl, setBaseUrl] = useLocalStorage<string>('baseUrl', defaultBaseUrl);
  const { aiState, setAiState, backendSynthComplete, setBackendSynthComplete } = useAiState();
  const { setModelInfo } = useLive2DConfig();
  const { setSubtitleText } = useSubtitle();
  const {
    messages: currentMessages,
    clearResponse,
    setForceNewMessage,
    appendHumanMessage,
    appendOrUpdateToolCallMessage,
    setCurrentHistoryUid,
    setMessages,
    setHistoryList,
    currentHistoryUid,
  } = useChatHistory();
  const { addAudioTask } = useAudioTask();
  const bgUrlContext = useBgUrl();
  const { confUid, setConfName, setConfUid, setConfigFiles } = useConfig();
  const [pendingModelInfo, setPendingModelInfo] = useState<ModelInfo | undefined>(undefined);
  const { selfUid, setSelfUid, setGroupMembers, setIsOwner } = useGroup();
  const { startMic, stopMic, autoStartMicOnConvEnd } = useVAD();
  const autoStartMicOnConvEndRef = useRef(autoStartMicOnConvEnd);
  const { interrupt } = useInterrupt();
  const { setBrowserViewData } = useBrowser();
  const { sessionId } = useSession();

  const [shouldSaveMessages, setShouldSaveMessages] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  useEffect(() => {
    autoStartMicOnConvEndRef.current = autoStartMicOnConvEnd;
  }, [autoStartMicOnConvEnd]);

  useEffect(() => {
    if (pendingModelInfo && confUid) {
      setModelInfo(pendingModelInfo);
      setPendingModelInfo(undefined);
    }
  }, [pendingModelInfo, setModelInfo, confUid]);

  const saveMessages = useCallback(async (messagesToSave: Message[]) => {
    if (!selfUid || !confUid || !sessionId || messagesToSave.length === 0) {
      console.warn('Cannot save messages: missing user ID, agent ID, session ID, or no messages');
      return;
    }

    const stmMessages = messagesToSave.map((msg) => ({
      type: (msg.role === 'human' ? 'human' : 'ai') as 'human' | 'ai',
      content: msg.content,
    }));

    try {
      await desktopMateAdapter.addChatHistory({
        user_id: selfUid,
        agent_id: confUid,
        session_id: sessionId,
        messages: stmMessages,
      });
      console.log('Messages saved to backend STM API.');
      
      // Also save to local storage as backup
      saveMessagesToLocal(sessionId, selfUid, confUid, messagesToSave);
    } catch (error) {
      console.error('Failed to save messages to backend STM API:', error);
      
      // Fallback: Save to local storage
      saveMessagesToLocal(sessionId, selfUid, confUid, messagesToSave);
      
      // Add to pending sync queue
      addToPendingSync(sessionId, selfUid, confUid, stmMessages);
      
      toaster.create({
        title: t('error.saveMessageFailed'),
        description: t('error.messagesSavedLocally'),
        type: 'warning',
        duration: 5000,
      });
    }
  }, [selfUid, confUid, sessionId, t]);

  const loadHistory = useCallback(async () => {
    if (!selfUid || !confUid || !sessionId) {
      console.warn('Cannot load history: missing user ID, agent ID, or session ID');
      return;
    }

    try {
      const response = await desktopMateAdapter.getChatHistory({
        user_id: selfUid,
        agent_id: confUid,
        session_id: sessionId,
      });
      const loadedMessages: Message[] = response.messages.map((msg) => ({
        id: Math.random().toString(), // Generate a temporary ID for loaded messages
        content: msg.content,
        role: (msg.type === 'human' ? 'human' : 'ai') as 'human' | 'ai',
        type: 'text',
        timestamp: new Date().toISOString(),
      }));
      setMessages(loadedMessages);
      setHasLoadedHistory(true);
      console.log('History loaded from backend STM API.', { count: loadedMessages.length });
      
      // Also save to local storage for backup
      saveMessagesToLocal(sessionId, selfUid, confUid, loadedMessages);
    } catch (error) {
      console.error('Failed to load history from backend STM API:', error);
      
      // Fallback: Try to load from local storage
      const localMessages = loadMessagesFromLocal(sessionId);
      if (localMessages && localMessages.length > 0) {
        setMessages(localMessages);
        setHasLoadedHistory(true);
        console.log('History loaded from local storage.', { count: localMessages.length });
        
        toaster.create({
          title: t('error.loadHistoryFailed'),
          description: t('error.historyLoadedFromLocal'),
          type: 'warning',
          duration: 5000,
        });
      } else {
        toaster.create({
          title: t('error.loadHistoryFailed'),
          type: 'error',
          duration: 3000,
        });
      }
    }
  }, [selfUid, confUid, sessionId, setMessages, t]);

  // Synchronize pending messages with backend
  const syncPendingMessages = useCallback(async () => {
    if (!selfUid || !confUid) {
      return;
    }

    const pending = getPendingSync();
    if (pending.length === 0) {
      return;
    }

    console.log(`Attempting to sync ${pending.length} pending message batch(es)...`);

    for (const batch of pending) {
      try {
        await desktopMateAdapter.addChatHistory({
          user_id: batch.userId,
          agent_id: batch.agentId,
          session_id: batch.sessionId,
          messages: batch.messages,
        });
        
        // Successfully synced, remove from pending queue
        removePendingSync(batch.sessionId);
        console.log('Pending messages synced for session:', batch.sessionId);
      } catch (error) {
        console.error('Failed to sync pending messages for session:', batch.sessionId, error);
        // Keep in pending queue for next attempt
      }
    }

    // Notify user if sync was successful
    const remainingPending = getPendingSync();
    if (pending.length > remainingPending.length) {
      toaster.create({
        title: t('success.messagesSynced'),
        description: t('success.pendingMessagesSyncedToBackend'),
        type: 'success',
        duration: 3000,
      });
    }
  }, [selfUid, confUid, t]);

  useEffect(() => {
    if (shouldSaveMessages) {
      saveMessages(currentMessages);
      setShouldSaveMessages(false);
    }
  }, [shouldSaveMessages, currentMessages, saveMessages]);

  // Initialize authentication token if not set
  useEffect(() => {
    const authConfig = configManager.getSection('auth');
    if (!authConfig.token) {
      // Generate a simple random token for initial authentication
      const defaultToken = `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      configManager.updateValue('auth', 'token', defaultToken);
      console.log('Generated default authentication token:', defaultToken);
    }
  }, []);

  // Load history on app initialization when all required IDs are available
  useEffect(() => {
    if (selfUid && confUid && sessionId && !hasLoadedHistory) {
      loadHistory();
    }
  }, [selfUid, confUid, sessionId, hasLoadedHistory, loadHistory]);

  // Sync pending messages when connection is established
  useEffect(() => {
    if (wsState === 'OPEN' && hasPendingSync()) {
      // Add a small delay to ensure backend is ready
      const timer = setTimeout(() => {
        syncPendingMessages();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [wsState, syncPendingMessages]);

  useEffect(() => {
    if (selfUid && confUid && currentHistoryUid) {
      loadHistory();
    }
  }, [selfUid, confUid, currentHistoryUid, loadHistory]);

  const handleControlMessage = useCallback((controlText: string) => {
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
          setAiState((currentState: AiState) => {
            if (currentState === 'thinking-speaking') {
              // Auto start mic if enabled
              if (autoStartMicOnConvEndRef.current) {
                startMic();
              }
              return 'idle';
            }
            return currentState;
          });
          resolve();
        }));
        break;
      default:
        console.warn('Unknown control command:', controlText);
    }
  }, [setAiState, clearResponse, startMic, stopMic]);

  const handleWebSocketMessage = useCallback((message: MessageEvent) => {
    console.log('Received message from server:', message);
    switch (message.type) {
      case 'control':
        if (message.text) {
          handleControlMessage(message.text);
        }
        break;
      case 'set-model-and-conf':
        setAiState('loading');
        if (message.conf_name) {
          setConfName(message.conf_name);
        }
        if (message.conf_uid) {
          setConfUid(message.conf_uid);
          console.log('confUid', message.conf_uid);
        }
        if (message.client_uid) {
          setSelfUid(message.client_uid);
        }
        setPendingModelInfo(message.model_info);
        // setModelInfo(message.model_info);
        // We don't know when the confRef in live2d-config-context will be updated, so we set a delay here for convenience
        if (message.model_info && !message.model_info.url.startsWith("http")) {
          const modelUrl = baseUrl + message.model_info.url;
          // eslint-disable-next-line no-param-reassign
          message.model_info.url = modelUrl;
        }

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
        setSubtitleText(t('notification.characterLoaded'));

        toaster.create({
          title: t('notification.characterSwitched'),
          type: 'success',
          duration: 2000,
        });

        // Configuration switched - no additional WebSocket messages needed
        // Session management is handled via REST API (/v1/stm/sessions)
        break;
      case 'background-files':
        if (message.files) {
          bgUrlContext?.setBackgroundFiles(message.files);
        }
        break;
      case 'audio':
        if (aiState === 'interrupted' || aiState === 'listening') {
          console.log('Audio playback intercepted. Sentence:', message.display_text?.text);
        } else {
          console.log("actions", message.actions);
          addAudioTask({
            audioBase64: message.audio || '',
            volumes: message.volumes || [],
            sliceLength: message.slice_length || 0,
            displayText: message.display_text || null,
            expressions: message.actions?.expressions || null,
            forwarded: message.forwarded || false,
          });
        }
        break;
      case 'history-data':
        if (message.messages) {
          setMessages(message.messages);
        }
        toaster.create({
          title: t('notification.historyLoaded'),
          type: 'success',
          duration: 2000,
        });
        setShouldSaveMessages(true);
        break;
      case 'new-history-created':
        setAiState('idle');
        setSubtitleText(t('notification.newConversation'));
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
            title: t('notification.newChatHistory'),
            type: 'success',
            duration: 2000,
          });
        }
        break;
      case 'history-deleted':
        toaster.create({
          title: message.success
            ? t('notification.historyDeleteSuccess')
            : t('notification.historyDeleteFail'),
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
          setShouldSaveMessages(true);
        }
        break;
      case 'error':
        toaster.create({
          title: message.message,
          type: 'error',
          duration: 2000,
        });
        break;
      case 'group-update':
        console.log('Received group-update:', message.members);
        if (message.members) {
          setGroupMembers(message.members);
        }
        if (message.is_owner !== undefined) {
          setIsOwner(message.is_owner);
        }
        break;
      case 'group-operation-result':
        toaster.create({
          title: message.message,
          type: message.success ? 'success' : 'error',
          duration: 2000,
        });
        break;
      case 'backend-synth-complete':
        setBackendSynthComplete(true);
        break;
      case 'conversation-chain-end':
        if (!audioTaskQueue.hasTask()) {
          setAiState((currentState: AiState) => {
            if (currentState === 'thinking-speaking') {
              return 'idle';
            }
            return currentState;
          });
        }
        break;
      case 'force-new-message':
        setForceNewMessage(true);
        break;
      case 'interrupt-signal':
        // Handle forwarded interrupt
        interrupt(false); // do not send interrupt signal to server
        break;
      case 'chat_response':
        if (message.content) {
          appendHumanMessage(message.content);
          setShouldSaveMessages(true);
        }
        break;
      case 'stream_token':
        if (message.chunk) {
          setSubtitleText(message.chunk);
        }
        break;
      case 'tool_call_status':
        if (message.tool_id && message.tool_name && message.status) {
          // If there's browser view data included, store it in the browser context
          if (message.browser_view) {
            console.log('Browser view data received:', message.browser_view);
            setBrowserViewData(message.browser_view);
          }

          appendOrUpdateToolCallMessage({
            id: message.tool_id,
            type: 'tool_call_status',
            role: 'ai',
            tool_id: message.tool_id,
            tool_name: message.tool_name,
            name: message.name,
            status: message.status as ('running' | 'completed' | 'error'),
            content: message.content || '',
            timestamp: new Date().toISOString(),
          });
          setShouldSaveMessages(true);
        } else {
          console.warn('Received incomplete tool_call_status message:', message);
        }
        break;
      case 'tts_ready_chunk':
        console.log('Received tts_ready_chunk:', { chunk: message.chunk?.substring(0, 50), emotion: message.emotion });
        
        // Handle TTS chunk if not interrupted
        if (aiState === 'interrupted' || aiState === 'listening') {
          console.log('TTS chunk playback intercepted due to state:', aiState);
        } else if (message.chunk) {
          try {
            // Extract volume information from the audio chunk
            const volumes = extractVolumesFromWAV(message.chunk);
            
            // Queue the audio chunk for playback
            addAudioTask({
              audioBase64: message.chunk,
              volumes,
              sliceLength: volumes.length, // Use the number of volume frames
              displayText: null, // TTS chunks typically don't have display text
              expressions: message.emotion ? [message.emotion] : null,
              forwarded: false,
            });
            
            console.log('TTS chunk queued for playback:', {
              volumeFrames: volumes.length,
              emotion: message.emotion,
            });
          } catch (error) {
            console.error('Failed to process TTS chunk:', error);
          }
        } else {
          console.warn('Received tts_ready_chunk without chunk data');
        }
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [aiState, addAudioTask, appendHumanMessage, baseUrl, bgUrlContext, setAiState, setConfName, setConfUid, setConfigFiles, setCurrentHistoryUid, setHistoryList, setMessages, setModelInfo, setSubtitleText, startMic, stopMic, setSelfUid, setGroupMembers, setIsOwner, backendSynthComplete, setBackendSynthComplete, clearResponse, handleControlMessage, appendOrUpdateToolCallMessage, interrupt, setBrowserViewData, t]);

  useEffect(() => {
    wsService.connect(wsUrl);
  }, [wsUrl]);

  useEffect(() => {
    const stateSubscription = wsService.onStateChange(setWsState);
    const messageSubscription = wsService.onMessage(handleWebSocketMessage);
    return () => {
      stateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [wsUrl, handleWebSocketMessage]);

  const webSocketContextValue = useMemo(() => ({
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState,
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl,
    baseUrl,
    setBaseUrl,
  }), [wsState, wsUrl, baseUrl]);

  return (
    <WebSocketContext.Provider value={webSocketContextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export default WebSocketHandler;
