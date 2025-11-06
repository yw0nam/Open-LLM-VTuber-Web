import { create } from 'zustand';
import { AudioTask, AudioQueueStatus, AudioQueueMetadata } from '@/types/audio-task';

/**
 * Audio Queue Store State Interface
 */
interface AudioQueueState {
  /** Array of audio tasks in the queue */
  queue: AudioTask[];
  
  /** Current queue status */
  status: AudioQueueStatus;
  
  /** ID of currently playing task */
  currentTaskId: string | null;
  
  /** Number of completed tasks in current session */
  completedCount: number;
  
  /** Actions */
  
  /**
   * Add a task to the end of the queue
   */
  enqueue: (task: Omit<AudioTask, 'id' | 'timestamp'>) => void;
  
  /**
   * Add a task to the front of the queue (high priority)
   */
  enqueuePriority: (task: Omit<AudioTask, 'id' | 'timestamp'>) => void;
  
  /**
   * Remove and return the next task from the queue
   */
  dequeue: () => AudioTask | null;
  
  /**
   * Clear all tasks from the queue
   */
  clear: () => void;
  
  /**
   * Set the current playing task
   */
  setCurrentTask: (taskId: string | null) => void;
  
  /**
   * Set the queue status
   */
  setStatus: (status: AudioQueueStatus) => void;
  
  /**
   * Increment completed task count
   */
  incrementCompleted: () => void;
  
  /**
   * Get queue metadata
   */
  getMetadata: () => AudioQueueMetadata;
  
  /**
   * Get the next task without removing it
   */
  peek: () => AudioTask | null;
  
  /**
   * Remove a specific task by ID
   */
  removeTask: (taskId: string) => void;
  
  /**
   * Check if queue has tasks
   */
  hasTask: () => boolean;
}

/**
 * Generate a unique ID for audio tasks
 */
const generateTaskId = (): string => {
  return `audio-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Zustand store for audio queue management
 * Provides centralized state management for audio playback tasks
 */
export const useAudioQueueStore = create<AudioQueueState>((set, get) => ({
  queue: [],
  status: AudioQueueStatus.IDLE,
  currentTaskId: null,
  completedCount: 0,

  enqueue: (taskData) => {
    const task: AudioTask = {
      ...taskData,
      id: generateTaskId(),
      timestamp: Date.now(),
    };
    
    set((state) => ({
      queue: [...state.queue, task],
    }));
    
    console.log(`[AudioQueue] Enqueued task ${task.id}, queue size: ${get().queue.length}`);
  },

  enqueuePriority: (taskData) => {
    const task: AudioTask = {
      ...taskData,
      id: generateTaskId(),
      timestamp: Date.now(),
      priority: taskData.priority ?? 100, // High priority by default
    };
    
    set((state) => ({
      queue: [task, ...state.queue],
    }));
    
    console.log(`[AudioQueue] Enqueued priority task ${task.id}, queue size: ${get().queue.length}`);
  },

  dequeue: () => {
    const state = get();
    if (state.queue.length === 0) {
      return null;
    }
    
    const [nextTask, ...remainingQueue] = state.queue;
    set({ queue: remainingQueue });
    
    console.log(`[AudioQueue] Dequeued task ${nextTask.id}, remaining: ${remainingQueue.length}`);
    return nextTask;
  },

  clear: () => {
    const state = get();
    const queueSize = state.queue.length;
    
    set({
      queue: [],
      status: AudioQueueStatus.IDLE,
      currentTaskId: null,
    });
    
    console.log(`[AudioQueue] Cleared ${queueSize} tasks from queue`);
  },

  setCurrentTask: (taskId) => {
    set({ currentTaskId: taskId });
    
    if (taskId) {
      console.log(`[AudioQueue] Set current task to ${taskId}`);
    } else {
      console.log(`[AudioQueue] Cleared current task`);
    }
  },

  setStatus: (status) => {
    set({ status });
    console.log(`[AudioQueue] Status changed to ${status}`);
  },

  incrementCompleted: () => {
    set((state) => ({
      completedCount: state.completedCount + 1,
    }));
  },

  getMetadata: () => {
    const state = get();
    return {
      totalTasks: state.queue.length,
      completedTasks: state.completedCount,
      status: state.status,
      currentTaskId: state.currentTaskId,
    };
  },

  peek: () => {
    const state = get();
    return state.queue.length > 0 ? state.queue[0] : null;
  },

  removeTask: (taskId) => {
    set((state) => ({
      queue: state.queue.filter((task) => task.id !== taskId),
    }));
    
    console.log(`[AudioQueue] Removed task ${taskId}`);
  },

  hasTask: () => {
    return get().queue.length > 0 || get().currentTaskId !== null;
  },
}));

/**
 * Hook to access audio queue store with common selectors
 */
export const useAudioQueue = () => {
  const queue = useAudioQueueStore((state) => state.queue);
  const status = useAudioQueueStore((state) => state.status);
  const currentTaskId = useAudioQueueStore((state) => state.currentTaskId);
  const completedCount = useAudioQueueStore((state) => state.completedCount);
  
  const enqueue = useAudioQueueStore((state) => state.enqueue);
  const enqueuePriority = useAudioQueueStore((state) => state.enqueuePriority);
  const dequeue = useAudioQueueStore((state) => state.dequeue);
  const clear = useAudioQueueStore((state) => state.clear);
  const setCurrentTask = useAudioQueueStore((state) => state.setCurrentTask);
  const setStatus = useAudioQueueStore((state) => state.setStatus);
  const incrementCompleted = useAudioQueueStore((state) => state.incrementCompleted);
  const getMetadata = useAudioQueueStore((state) => state.getMetadata);
  const peek = useAudioQueueStore((state) => state.peek);
  const removeTask = useAudioQueueStore((state) => state.removeTask);
  const hasTask = useAudioQueueStore((state) => state.hasTask);

  return {
    // State
    queue,
    status,
    currentTaskId,
    completedCount,
    
    // Actions
    enqueue,
    enqueuePriority,
    dequeue,
    clear,
    setCurrentTask,
    setStatus,
    incrementCompleted,
    getMetadata,
    peek,
    removeTask,
    hasTask,
  };
};
