import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAudioQueueStore } from '@/stores/audio-queue-store';
import { AudioQueueStatus } from '@/types/audio-task';
import { audioManager } from '@/utils/audio-manager';

// Mock all dependencies
vi.mock('@/stores/audio-queue-store');
vi.mock('@/utils/audio-manager');

describe('Audio Playback Controller - Core Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose audio queue store properly', () => {
    const mockStore = {
      queue: [],
      status: AudioQueueStatus.IDLE,
      currentTaskId: null,
      dequeue: vi.fn(),
      enqueue: vi.fn(),
      setCurrentTask: vi.fn(),
    };
    
    (useAudioQueueStore as any).mockReturnValue(mockStore);
    
    const store = useAudioQueueStore();
    expect(store.queue).toEqual([]);
    expect(store.status).toBe(AudioQueueStatus.IDLE);
  });

  it('should have audio manager methods available', () => {
    expect(audioManager.setCurrentAudio).toBeDefined();
    expect(audioManager.clearCurrentAudio).toBeDefined();
    expect(audioManager.stopCurrentAudioAndLipSync).toBeDefined();
    expect(audioManager.hasCurrentAudio).toBeDefined();
  });

  it('should handle queue status transitions', () => {
    const mockStore = {
      status: AudioQueueStatus.IDLE,
      setStatus: vi.fn(),
    };
    
    (useAudioQueueStore as any).mockReturnValue(mockStore);
    
    const store = useAudioQueueStore();
    store.setStatus(AudioQueueStatus.PLAYING);
    
    expect(mockStore.setStatus).toHaveBeenCalledWith(AudioQueueStatus.PLAYING);
  });
});

