/**
 * Message Persistence Service
 * 
 * Provides local storage fallback for message persistence when backend is unavailable.
 * Handles synchronization between local and backend storage.
 */

import { Message } from './websocket-service';
import { STMMessage } from './config-types';
import { debugLog, errorLog } from './logger';

const STORAGE_KEY_PREFIX = 'message_history_';
const PENDING_SYNC_KEY = 'pending_sync_messages';

export interface LocalMessageStore {
  sessionId: string;
  userId: string;
  agentId: string;
  messages: Message[];
  lastUpdated: string;
}

export interface PendingSyncMessage {
  sessionId: string;
  userId: string;
  agentId: string;
  messages: STMMessage[];
  timestamp: string;
}

/**
 * Save messages to local storage
 */
export function saveMessagesToLocal(
  sessionId: string,
  userId: string,
  agentId: string,
  messages: Message[]
): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionId}`;
    const store: LocalMessageStore = {
      sessionId,
      userId,
      agentId,
      messages,
      lastUpdated: new Date().toISOString(),
    };
    
    localStorage.setItem(key, JSON.stringify(store));
    debugLog('message-persistence', 'Messages saved to local storage', {
      sessionId,
      count: messages.length,
    });
  } catch (error) {
    errorLog('message-persistence', 'Failed to save messages to local storage', error as Error);
  }
}

/**
 * Load messages from local storage
 */
export function loadMessagesFromLocal(sessionId: string): Message[] | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionId}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const store: LocalMessageStore = JSON.parse(stored);
    debugLog('message-persistence', 'Messages loaded from local storage', {
      sessionId,
      count: store.messages.length,
    });
    
    return store.messages;
  } catch (error) {
    errorLog('message-persistence', 'Failed to load messages from local storage', error as Error);
    return null;
  }
}

/**
 * Clear local storage for a session
 */
export function clearLocalMessages(sessionId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${sessionId}`;
    localStorage.removeItem(key);
    debugLog('message-persistence', 'Local messages cleared', { sessionId });
  } catch (error) {
    errorLog('message-persistence', 'Failed to clear local messages', error as Error);
  }
}

/**
 * Add messages to pending sync queue
 */
export function addToPendingSync(
  sessionId: string,
  userId: string,
  agentId: string,
  messages: STMMessage[]
): void {
  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    const pending: PendingSyncMessage[] = stored ? JSON.parse(stored) : [];
    
    // Check if there's already a pending sync for this session
    const existingIndex = pending.findIndex(p => p.sessionId === sessionId);
    
    if (existingIndex >= 0) {
      // Merge messages (avoid duplicates based on content and timestamp)
      const existing = pending[existingIndex];
      const merged = [...existing.messages];
      
      for (const msg of messages) {
        const isDuplicate = merged.some(
          m => m.content === msg.content && m.type === msg.type
        );
        if (!isDuplicate) {
          merged.push(msg);
        }
      }
      
      pending[existingIndex] = {
        ...existing,
        messages: merged,
        timestamp: new Date().toISOString(),
      };
    } else {
      pending.push({
        sessionId,
        userId,
        agentId,
        messages,
        timestamp: new Date().toISOString(),
      });
    }
    
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
    debugLog('message-persistence', 'Messages added to pending sync', {
      sessionId,
      count: messages.length,
      totalPending: pending.length,
    });
  } catch (error) {
    errorLog('message-persistence', 'Failed to add messages to pending sync', error as Error);
  }
}

/**
 * Get all pending sync messages
 */
export function getPendingSync(): PendingSyncMessage[] {
  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    errorLog('message-persistence', 'Failed to get pending sync messages', error as Error);
    return [];
  }
}

/**
 * Remove a session from pending sync queue
 */
export function removePendingSync(sessionId: string): void {
  try {
    const stored = localStorage.getItem(PENDING_SYNC_KEY);
    if (!stored) return;
    
    const pending: PendingSyncMessage[] = JSON.parse(stored);
    const filtered = pending.filter(p => p.sessionId !== sessionId);
    
    if (filtered.length === 0) {
      localStorage.removeItem(PENDING_SYNC_KEY);
    } else {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(filtered));
    }
    
    debugLog('message-persistence', 'Session removed from pending sync', { sessionId });
  } catch (error) {
    errorLog('message-persistence', 'Failed to remove pending sync', error as Error);
  }
}

/**
 * Check if there are any pending sync messages
 */
export function hasPendingSync(): boolean {
  const pending = getPendingSync();
  return pending.length > 0;
}
