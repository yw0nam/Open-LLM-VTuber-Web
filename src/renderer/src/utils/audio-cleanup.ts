import { audioManager } from './audio-manager';
import { useAudioQueueStore } from '@/stores/audio-queue-store';
import { AudioQueueStatus } from '@/types/audio-task';

/**
 * Audio cleanup and interruption handler
 * Manages cleanup of audio resources and queue interruptions
 */
export class AudioCleanupManager {
  private static instance: AudioCleanupManager;
  private cleanupCallbacks: Set<() => void> = new Set();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): AudioCleanupManager {
    if (!AudioCleanupManager.instance) {
      AudioCleanupManager.instance = new AudioCleanupManager();
    }
    return AudioCleanupManager.instance;
  }

  /**
   * Register a cleanup callback
   */
  registerCleanup(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback);
    
    // Return unregister function
    return () => {
      this.cleanupCallbacks.delete(callback);
    };
  }

  /**
   * Execute all registered cleanup callbacks
   */
  executeCleanups(): void {
    console.log(`[AudioCleanup] Executing ${this.cleanupCallbacks.size} cleanup callbacks`);
    
    this.cleanupCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('[AudioCleanup] Error executing cleanup callback:', error);
      }
    });
  }

  /**
   * Interrupt current playback and clear queue
   */
  interruptAndClearQueue(): void {
    console.log('[AudioCleanup] Interrupting playback and clearing queue');
    
    // Stop current audio
    audioManager.stopCurrentAudioAndLipSync();
    
    // Clear queue
    const store = useAudioQueueStore.getState();
    store.clear();
    
    // Execute all cleanup callbacks
    this.executeCleanups();
    
    console.log('[AudioCleanup] Interruption complete');
  }

  /**
   * Clean up a single audio element
   */
  cleanupAudioElement(audio: HTMLAudioElement): void {
    try {
      // Pause and reset audio
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      
      // Remove all event listeners by cloning
      const clone = audio.cloneNode(true) as HTMLAudioElement;
      audio.replaceWith(clone);
      
      // Trigger garbage collection hint
      (audio as any)._cleaned = true;
      
      console.log('[AudioCleanup] Cleaned up audio element');
    } catch (error) {
      console.error('[AudioCleanup] Error cleaning up audio element:', error);
    }
  }

  /**
   * Clear all resources on component unmount or app shutdown
   */
  clearAllResources(): void {
    console.log('[AudioCleanup] Clearing all audio resources');
    
    // Stop all audio
    audioManager.stopCurrentAudioAndLipSync();
    
    // Clear queue
    const store = useAudioQueueStore.getState();
    store.clear();
    store.setStatus(AudioQueueStatus.IDLE);
    store.setCurrentTask(null);
    
    // Execute cleanups
    this.executeCleanups();
    
    // Clear cleanup callbacks
    this.cleanupCallbacks.clear();
    
    console.log('[AudioCleanup] All resources cleared');
  }
}

/**
 * Singleton instance export
 */
export const audioCleanupManager = AudioCleanupManager.getInstance();

/**
 * Hook for audio cleanup registration
 * Returns an unregister function
 */
export const useAudioCleanup = (cleanup: () => void): (() => void) => {
  const unregister = audioCleanupManager.registerCleanup(cleanup);
  
  // Return unregister function for manual cleanup
  return unregister;
};
