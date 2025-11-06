import { describe, it, expect, beforeEach } from 'vitest';
import { useAudioQueueStore } from '../audio-queue-store';
import { AudioQueueStatus } from '@/types/audio-task';

describe('AudioQueueStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAudioQueueStore.getState();
    store.clear();
    useAudioQueueStore.setState({
      completedCount: 0,
    });
  });

  describe('enqueue', () => {
    it('should add a task to the queue', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'test-audio-data',
        volumes: [1.0],
        sliceLength: 1000,
        displayText: { text: 'Test', name: 'Assistant', avatar: '' },
      });

      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].audioBase64).toBe('test-audio-data');
      expect(state.queue[0].id).toBeDefined();
      expect(state.queue[0].timestamp).toBeDefined();
    });

    it('should add multiple tasks in order', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.enqueue({
        audioBase64: 'audio-2',
        volumes: [1.0],
        sliceLength: 1000,
      });

      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.queue[0].audioBase64).toBe('audio-1');
      expect(state.queue[1].audioBase64).toBe('audio-2');
    });
  });

  describe('enqueuePriority', () => {
    it('should add a task to the front of the queue', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-normal',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.enqueuePriority({
        audioBase64: 'audio-priority',
        volumes: [1.0],
        sliceLength: 1000,
      });

      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.queue[0].audioBase64).toBe('audio-priority');
      expect(state.queue[1].audioBase64).toBe('audio-normal');
    });

    it('should set default high priority', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueuePriority({
        audioBase64: 'audio-priority',
        volumes: [1.0],
        sliceLength: 1000,
      });

      const state = useAudioQueueStore.getState();
      expect(state.queue[0].priority).toBe(100);
    });
  });

  describe('dequeue', () => {
    it('should remove and return the first task', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.enqueue({
        audioBase64: 'audio-2',
        volumes: [1.0],
        sliceLength: 1000,
      });

      const task = store.dequeue();
      
      expect(task).toBeDefined();
      expect(task?.audioBase64).toBe('audio-1');
      
      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].audioBase64).toBe('audio-2');
    });

    it('should return null when queue is empty', () => {
      const store = useAudioQueueStore.getState();
      const task = store.dequeue();
      
      expect(task).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all tasks from the queue', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.enqueue({
        audioBase64: 'audio-2',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.clear();
      
      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.status).toBe(AudioQueueStatus.IDLE);
      expect(state.currentTaskId).toBeNull();
    });
  });

  describe('setCurrentTask', () => {
    it('should set the current task ID', () => {
      const store = useAudioQueueStore.getState();
      
      store.setCurrentTask('task-123');
      
      const state = useAudioQueueStore.getState();
      expect(state.currentTaskId).toBe('task-123');
    });

    it('should clear the current task ID when set to null', () => {
      const store = useAudioQueueStore.getState();
      
      store.setCurrentTask('task-123');
      store.setCurrentTask(null);
      
      const state = useAudioQueueStore.getState();
      expect(state.currentTaskId).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('should update the queue status', () => {
      const store = useAudioQueueStore.getState();
      
      store.setStatus(AudioQueueStatus.PLAYING);
      
      const state = useAudioQueueStore.getState();
      expect(state.status).toBe(AudioQueueStatus.PLAYING);
    });
  });

  describe('incrementCompleted', () => {
    it('should increment the completed count', () => {
      const store = useAudioQueueStore.getState();
      
      store.incrementCompleted();
      store.incrementCompleted();
      
      const state = useAudioQueueStore.getState();
      expect(state.completedCount).toBe(2);
    });
  });

  describe('getMetadata', () => {
    it('should return correct metadata', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.enqueue({
        audioBase64: 'audio-2',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.setStatus(AudioQueueStatus.PLAYING);
      store.setCurrentTask('task-123');
      store.incrementCompleted();

      const metadata = store.getMetadata();
      
      expect(metadata.totalTasks).toBe(2);
      expect(metadata.completedTasks).toBe(1);
      expect(metadata.status).toBe(AudioQueueStatus.PLAYING);
      expect(metadata.currentTaskId).toBe('task-123');
    });
  });

  describe('peek', () => {
    it('should return the first task without removing it', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      const task = store.peek();
      
      expect(task).toBeDefined();
      expect(task?.audioBase64).toBe('audio-1');
      
      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(1);
    });

    it('should return null when queue is empty', () => {
      const store = useAudioQueueStore.getState();
      const task = store.peek();
      
      expect(task).toBeNull();
    });
  });

  describe('removeTask', () => {
    it('should remove a specific task by ID', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      const state1 = useAudioQueueStore.getState();
      const taskId = state1.queue[0].id;

      store.enqueue({
        audioBase64: 'audio-2',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.removeTask(taskId);
      
      const state2 = useAudioQueueStore.getState();
      expect(state2.queue).toHaveLength(1);
      expect(state2.queue[0].audioBase64).toBe('audio-2');
    });
  });

  describe('hasTask', () => {
    it('should return true when queue has tasks', () => {
      const store = useAudioQueueStore.getState();
      
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      expect(store.hasTask()).toBe(true);
    });

    it('should return true when there is a current task', () => {
      const store = useAudioQueueStore.getState();
      
      store.setCurrentTask('task-123');
      
      expect(store.hasTask()).toBe(true);
    });

    it('should return false when queue is empty and no current task', () => {
      const store = useAudioQueueStore.getState();
      
      expect(store.hasTask()).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete playback cycle', () => {
      const store = useAudioQueueStore.getState();
      
      // Add tasks
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.enqueue({
        audioBase64: 'audio-2',
        volumes: [1.0],
        sliceLength: 1000,
      });

      // Start playing first task
      const task1 = store.dequeue();
      expect(task1?.audioBase64).toBe('audio-1');
      
      store.setCurrentTask(task1!.id);
      store.setStatus(AudioQueueStatus.PLAYING);

      // Complete first task
      store.setCurrentTask(null);
      store.incrementCompleted();

      // Start second task
      const task2 = store.dequeue();
      expect(task2?.audioBase64).toBe('audio-2');
      
      store.setCurrentTask(task2!.id);

      // Complete second task
      store.setCurrentTask(null);
      store.incrementCompleted();
      store.setStatus(AudioQueueStatus.IDLE);

      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.completedCount).toBe(2);
      expect(state.status).toBe(AudioQueueStatus.IDLE);
    });

    it('should handle interruption scenario', () => {
      const store = useAudioQueueStore.getState();
      
      // Add tasks
      store.enqueue({
        audioBase64: 'audio-1',
        volumes: [1.0],
        sliceLength: 1000,
      });

      store.enqueue({
        audioBase64: 'audio-2',
        volumes: [1.0],
        sliceLength: 1000,
      });

      // Start playing
      const task = store.dequeue();
      store.setCurrentTask(task!.id);
      store.setStatus(AudioQueueStatus.PLAYING);

      // Interrupt
      store.clear();

      const state = useAudioQueueStore.getState();
      expect(state.queue).toHaveLength(0);
      expect(state.status).toBe(AudioQueueStatus.IDLE);
      expect(state.currentTaskId).toBeNull();
    });
  });
});
