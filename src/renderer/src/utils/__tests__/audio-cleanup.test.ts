import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioCleanupManager, audioCleanupManager, useAudioCleanup } from '../audio-cleanup';
import { audioManager } from '../audio-manager';
import { useAudioQueueStore } from '@/stores/audio-queue-store';
import { AudioQueueStatus } from '@/types/audio-task';

vi.mock('../audio-manager');
vi.mock('@/stores/audio-queue-store');

describe('AudioCleanupManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the singleton instance for testing
    (AudioCleanupManager as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = AudioCleanupManager.getInstance();
      const instance2 = AudioCleanupManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(audioCleanupManager).toBeInstanceOf(AudioCleanupManager);
    });
  });

  describe('registerCleanup', () => {
    it('should register a cleanup callback', () => {
      const manager = AudioCleanupManager.getInstance();
      const cleanup = vi.fn();
      
      manager.registerCleanup(cleanup);
      manager.executeCleanups();
      
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should return an unregister function', () => {
      const manager = AudioCleanupManager.getInstance();
      const cleanup = vi.fn();
      
      const unregister = manager.registerCleanup(cleanup);
      unregister();
      
      manager.executeCleanups();
      
      expect(cleanup).not.toHaveBeenCalled();
    });

    it('should register multiple callbacks', () => {
      const manager = AudioCleanupManager.getInstance();
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      
      manager.registerCleanup(cleanup1);
      manager.registerCleanup(cleanup2);
      
      manager.executeCleanups();
      
      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeCleanups', () => {
    it('should execute all registered callbacks', () => {
      const manager = AudioCleanupManager.getInstance();
      const cleanups = [vi.fn(), vi.fn(), vi.fn()];
      
      cleanups.forEach((cleanup) => manager.registerCleanup(cleanup));
      manager.executeCleanups();
      
      cleanups.forEach((cleanup) => {
        expect(cleanup).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle errors in cleanup callbacks gracefully', () => {
      const manager = AudioCleanupManager.getInstance();
      const errorCleanup = vi.fn(() => {
        throw new Error('Cleanup error');
      });
      const successCleanup = vi.fn();
      
      manager.registerCleanup(errorCleanup);
      manager.registerCleanup(successCleanup);
      
      // Should not throw
      expect(() => manager.executeCleanups()).not.toThrow();
      
      // Both should be called
      expect(errorCleanup).toHaveBeenCalled();
      expect(successCleanup).toHaveBeenCalled();
    });
  });

  describe('interruptAndClearQueue', () => {
    it('should stop audio and clear queue', () => {
      const manager = AudioCleanupManager.getInstance();
      const mockStore = {
        clear: vi.fn(),
        setStatus: vi.fn(),
        setCurrentTask: vi.fn(),
      };
      
      (useAudioQueueStore.getState as any) = vi.fn().mockReturnValue(mockStore);
      
      manager.interruptAndClearQueue();
      
      expect(audioManager.stopCurrentAudioAndLipSync).toHaveBeenCalled();
      expect(mockStore.clear).toHaveBeenCalled();
    });

    it('should execute cleanup callbacks on interruption', () => {
      const manager = AudioCleanupManager.getInstance();
      const cleanup = vi.fn();
      const mockStore = {
        clear: vi.fn(),
      };
      
      (useAudioQueueStore.getState as any) = vi.fn().mockReturnValue(mockStore);
      
      manager.registerCleanup(cleanup);
      manager.interruptAndClearQueue();
      
      expect(cleanup).toHaveBeenCalled();
    });
  });

  describe('cleanupAudioElement', () => {
    it('should clean up an audio element', () => {
      const manager = AudioCleanupManager.getInstance();
      const mockAudio = {
        pause: vi.fn(),
        currentTime: 5,
        src: 'test-src',
        cloneNode: vi.fn().mockReturnThis(),
        replaceWith: vi.fn(),
      } as any;
      
      manager.cleanupAudioElement(mockAudio);
      
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.src).toBe('');
      expect(mockAudio.currentTime).toBe(0);
    });

    it('should handle cleanup errors gracefully', () => {
      const manager = AudioCleanupManager.getInstance();
      const mockAudio = {
        pause: vi.fn(() => {
          throw new Error('Pause error');
        }),
      } as any;
      
      // Should not throw
      expect(() => manager.cleanupAudioElement(mockAudio)).not.toThrow();
    });
  });

  describe('clearAllResources', () => {
    it('should clear all audio resources', () => {
      const manager = AudioCleanupManager.getInstance();
      const cleanup = vi.fn();
      const mockStore = {
        clear: vi.fn(),
        setStatus: vi.fn(),
        setCurrentTask: vi.fn(),
      };
      
      (useAudioQueueStore.getState as any) = vi.fn().mockReturnValue(mockStore);
      
      manager.registerCleanup(cleanup);
      manager.clearAllResources();
      
      expect(audioManager.stopCurrentAudioAndLipSync).toHaveBeenCalled();
      expect(mockStore.clear).toHaveBeenCalled();
      expect(mockStore.setStatus).toHaveBeenCalledWith(AudioQueueStatus.IDLE);
      expect(mockStore.setCurrentTask).toHaveBeenCalledWith(null);
      expect(cleanup).toHaveBeenCalled();
    });

    it('should clear all cleanup callbacks', () => {
      const manager = AudioCleanupManager.getInstance();
      const cleanup = vi.fn();
      const mockStore = {
        clear: vi.fn(),
        setStatus: vi.fn(),
        setCurrentTask: vi.fn(),
      };
      
      (useAudioQueueStore.getState as any) = vi.fn().mockReturnValue(mockStore);
      
      manager.registerCleanup(cleanup);
      manager.clearAllResources();
      
      // Execute cleanups again - should not call the callback
      manager.executeCleanups();
      
      expect(cleanup).toHaveBeenCalledTimes(1); // Only from clearAllResources
    });
  });

  describe('useAudioCleanup', () => {
    it('should register cleanup and return unregister function', () => {
      const cleanup = vi.fn();
      
      const unregister = useAudioCleanup(cleanup);
      
      expect(typeof unregister).toBe('function');
      
      audioCleanupManager.executeCleanups();
      expect(cleanup).toHaveBeenCalled();
      
      cleanup.mockClear();
      unregister();
      
      audioCleanupManager.executeCleanups();
      expect(cleanup).not.toHaveBeenCalled();
    });
  });
});
