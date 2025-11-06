/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioQueueStore } from '@/stores/audio-queue-store';
import { AudioQueueStatus } from '@/types/audio-task';
import { audioManager } from '@/utils/audio-manager';
import { toaster } from '@/components/ui/toaster';
import { useAiState } from '@/context/ai-state-context';
import { useSubtitle } from '@/context/subtitle-context';
import { useChatHistory } from '@/context/chat-history-context';
import { useWebSocket } from '@/context/websocket-context';
import { useLive2DExpression } from '@/hooks/canvas/use-live2d-expression';
import type { AudioTask } from '@/types/audio-task';
import * as LAppDefine from '../../../WebSDK/src/lappdefine';

/**
 * Hook for sequential audio playback controller
 * Handles automatic playback of queued audio tasks
 */
export const useAudioPlaybackController = () => {
  const { t } = useTranslation();
  const { aiState, isInterrupted } = useAiState();
  const { setSubtitleText } = useSubtitle();
  const { appendResponse, appendAIMessage } = useChatHistory();
  const { sendMessage } = useWebSocket();
  const { setExpression } = useLive2DExpression();

  const {
    queue,
    status,
    currentTaskId,
    dequeue,
    setCurrentTask,
    setStatus,
    incrementCompleted,
    peek,
  } = useAudioQueueStore();

  // Ref to track if playback is in progress
  const isPlayingRef = useRef(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Play a single audio task
   */
  const playAudioTask = useCallback(
    (task: AudioTask): Promise<void> => {
      return new Promise((resolve) => {
        // Check for interruption
        if (isInterrupted) {
          console.warn('[PlaybackController] Playback blocked by interruption state');
          resolve();
          return;
        }

        const { audioBase64, displayText, expressions, forwarded } = task;

        // Update display text
        if (displayText) {
          appendResponse(displayText.text);
          appendAIMessage(displayText.text, displayText.name, displayText.avatar);
          if (audioBase64) {
            setSubtitleText(displayText.text);
          }
          if (!forwarded) {
            sendMessage({
              type: 'audio-play-start',
              display_text: displayText,
              forwarded: true,
            });
          }
        }

        try {
          // Process audio if available
          if (!audioBase64) {
            resolve();
            return;
          }

          const audioDataUrl = `data:audio/wav;base64,${audioBase64}`;

          // Get Live2D manager and model
          const live2dManager = (window as any).getLive2DManager?.();
          if (!live2dManager) {
            console.error('[PlaybackController] Live2D manager not found');
            resolve();
            return;
          }

          const model = live2dManager.getModel(0);
          if (!model) {
            console.error('[PlaybackController] Live2D model not found at index 0');
            resolve();
            return;
          }

          console.log(`[PlaybackController] Playing task ${task.id}`);

          // Set expression if available
          const lappAdapter = (window as any).getLAppAdapter?.();
          if (lappAdapter && expressions?.[0] !== undefined) {
            setExpression(
              expressions[0],
              lappAdapter,
              `Set expression to: ${expressions[0]}`,
            );
          }

          // Start talk motion
          if (LAppDefine?.PriorityNormal) {
            console.log('[PlaybackController] Starting random "Talk" motion');
            model.startRandomMotion('Talk', LAppDefine.PriorityNormal);
          }

          // Setup audio element
          const audio = new Audio(audioDataUrl);
          audioElementRef.current = audio;

          // Register with global audio manager
          audioManager.setCurrentAudio(audio, model);
          let isFinished = false;

          const cleanup = () => {
            audioManager.clearCurrentAudio(audio);
            if (audioElementRef.current === audio) {
              audioElementRef.current = null;
            }
            if (!isFinished) {
              isFinished = true;
              resolve();
            }
          };

          // Enhance lip sync sensitivity
          const lipSyncScale = 2.0;

          audio.addEventListener('canplaythrough', () => {
            // Check for interruption before playback
            if (isInterrupted || !audioManager.hasCurrentAudio()) {
              console.warn('[PlaybackController] Playback cancelled due to interruption');
              cleanup();
              return;
            }

            console.log(`[PlaybackController] Starting audio playback for task ${task.id}`);
            audio.play().catch((err) => {
              console.error('[PlaybackController] Audio play error:', err);
              cleanup();
            });

            // Setup lip sync
            if (model._wavFileHandler) {
              if (!model._wavFileHandler._initialized) {
                console.log('[PlaybackController] Applying enhanced lip sync');
                model._wavFileHandler._initialized = true;

                const originalUpdate = model._wavFileHandler.update.bind(
                  model._wavFileHandler,
                );
                model._wavFileHandler.update = function (deltaTimeSeconds: number) {
                  const result = originalUpdate(deltaTimeSeconds);
                  // @ts-ignore
                  this._lastRms = Math.min(2.0, this._lastRms * lipSyncScale);
                  return result;
                };
              }

              if (audioManager.hasCurrentAudio()) {
                model._wavFileHandler.start(audioDataUrl);
              }
            }
          });

          audio.addEventListener('ended', () => {
            console.log(`[PlaybackController] Audio playback completed for task ${task.id}`);
            cleanup();
          });

          audio.addEventListener('error', (error) => {
            console.error('[PlaybackController] Audio playback error:', error);
            cleanup();
          });

          audio.load();
        } catch (error) {
          console.error('[PlaybackController] Audio playback setup error:', error);
          toaster.create({
            title: `${t('error.audioPlayback')}: ${error}`,
            type: 'error',
            duration: 2000,
          });
          resolve();
        }
      });
    },
    [
      aiState,
      isInterrupted,
      appendResponse,
      appendAIMessage,
      setSubtitleText,
      sendMessage,
      setExpression,
      t,
    ],
  );

  /**
   * Process the next task in the queue
   */
  const processNextTask = useCallback(async () => {
    // Don't process if already playing or interrupted
    if (isPlayingRef.current || isInterrupted) {
      return;
    }

    // Check if there's a task to play
    const nextTask = peek();
    if (!nextTask) {
      // No more tasks - set to idle
      if (status !== AudioQueueStatus.IDLE) {
        setStatus(AudioQueueStatus.IDLE);
        console.log('[PlaybackController] Queue empty, status set to IDLE');
      }
      return;
    }

    // Mark as playing
    isPlayingRef.current = true;
    setStatus(AudioQueueStatus.PLAYING);

    // Remove task from queue and set as current
    const task = dequeue();
    if (!task) {
      isPlayingRef.current = false;
      return;
    }

    setCurrentTask(task.id);
    console.log(`[PlaybackController] Started processing task ${task.id}`);

    // Play the audio
    await playAudioTask(task);

    // Task completed
    setCurrentTask(null);
    incrementCompleted();
    isPlayingRef.current = false;

    console.log(`[PlaybackController] Completed task ${task.id}`);

    // Process next task
    processNextTask();
  }, [
    isInterrupted,
    status,
    peek,
    dequeue,
    setCurrentTask,
    setStatus,
    incrementCompleted,
    playAudioTask,
  ]);

  /**
   * Stop current playback
   */
  const stopPlayback = useCallback(() => {
    console.log('[PlaybackController] Stopping playback');
    
    // Stop audio manager
    audioManager.stopCurrentAudioAndLipSync();
    
    // Clear audio element
    if (audioElementRef.current) {
      const audio = audioElementRef.current;
      audio.pause();
      audio.src = '';
      audio.load();
      audioElementRef.current = null;
    }
    
    // Reset state
    isPlayingRef.current = false;
    setCurrentTask(null);
  }, [setCurrentTask]);

  /**
   * Effect to monitor queue changes and trigger playback
   */
  useEffect(() => {
    // If there are tasks in queue and we're not playing, start processing
    if (queue.length > 0 && !isPlayingRef.current && status !== AudioQueueStatus.PLAYING) {
      processNextTask();
    }
  }, [queue.length, status, processNextTask]);

  /**
   * Effect to handle interruptions
   */
  useEffect(() => {
    if (isInterrupted && isPlayingRef.current) {
      console.log('[PlaybackController] Interruption detected, stopping playback');
      stopPlayback();
    }
  }, [isInterrupted, stopPlayback]);

  return {
    isPlaying: isPlayingRef.current || status === AudioQueueStatus.PLAYING,
    currentTaskId,
    queueLength: queue.length,
    stopPlayback,
  };
};
