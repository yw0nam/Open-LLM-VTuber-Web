import { DisplayText } from '@/services/websocket-service';

/**
 * Audio task object for queue management
 * Contains all necessary data for audio playback with Live2D lip sync
 */
export interface AudioTask {
  /** Unique identifier for the task */
  id: string;
  
  /** Base64-encoded audio data */
  audioBase64: string;
  
  /** Volume levels for the audio */
  volumes: number[];
  
  /** Length of audio slice in ms */
  sliceLength: number;
  
  /** Text to display during playback */
  displayText?: DisplayText | null;
  
  /** Expression indices or IDs for Live2D model */
  expressions?: string[] | number[] | null;
  
  /** Speaker UID for multi-speaker scenarios */
  speaker_uid?: string;
  
  /** Whether this task was forwarded from another instance */
  forwarded?: boolean;
  
  /** Timestamp when task was created */
  timestamp: number;
  
  /** Priority level (higher = more important) */
  priority?: number;
}

/**
 * Status of the audio queue
 */
export enum AudioQueueStatus {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  INTERRUPTED = 'interrupted',
}

/**
 * Metadata about the current queue state
 */
export interface AudioQueueMetadata {
  /** Total number of tasks in queue */
  totalTasks: number;
  
  /** Number of completed tasks */
  completedTasks: number;
  
  /** Current queue status */
  status: AudioQueueStatus;
  
  /** ID of currently playing task (if any) */
  currentTaskId: string | null;
}
