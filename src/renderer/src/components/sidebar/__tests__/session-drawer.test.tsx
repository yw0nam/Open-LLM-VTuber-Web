/**
 * Tests for Session Drawer Component and Hook
 * Tests session management functionality
 */

import { describe, it, beforeEach, vi, assert } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { SessionProvider } from '@/context/session-context';
import { useSessionDrawer } from '@/hooks/sidebar/use-session-drawer';
import { desktopMateAdapter } from '@/services/desktopmate-adapter';
import type { SessionMetadata } from '@/services/config-types';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/services/desktopmate-adapter', () => ({
  desktopMateAdapter: {
    listSessions: vi.fn(),
    getChatHistory: vi.fn(),
    addChatHistory: vi.fn(),
    deleteSession: vi.fn(),
  },
}));

vi.mock('@/services/logger', () => ({
  debugLog: vi.fn(),
  errorLog: vi.fn(),
}));

vi.mock('@/components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}));

const mockSessions: SessionMetadata[] = [
  {
    session_id: 'session-1',
    user_id: 'user-1',
    agent_id: 'agent-1',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T11:00:00Z',
    metadata: { message_count: 5 },
  },
  {
    session_id: 'session-2',
    user_id: 'user-1',
    agent_id: 'agent-1',
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T11:00:00Z',
    metadata: { message_count: 10 },
  },
];

describe('Session Drawer Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Store values as JSON strings
    localStorage.setItem('session_user_id', JSON.stringify('user-1'));
    localStorage.setItem('session_agent_id', JSON.stringify('agent-1'));
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );

  describe('Session Listing', () => {
    it('should load sessions when drawer is opened', async () => {
      // Setup
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open drawer
      result.current.setOpen(true);

      // Wait for sessions to load
      await waitFor(() => {
        assert.equal(result.current.sessions.length, 2);
      });

      // Verify sessions are correct
      assert.equal(result.current.sessions[0].session_id, 'session-1');
      assert.equal(result.current.sessions[1].session_id, 'session-2');
    });

    it('should handle empty session list', async () => {
      // Setup
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: [],
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open drawer
      result.current.setOpen(true);

      // Wait for loading to complete and verify empty list
      await waitFor(() => {
        assert.equal(result.current.sessions.length, 0);
      });
    });

    it('should set loading state while fetching sessions', async () => {
      // Setup delayed response
      vi.mocked(desktopMateAdapter.listSessions).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ sessions: mockSessions }), 50))
      );

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open drawer
      result.current.setOpen(true);

      // Should be loading initially
      await waitFor(() => {
        assert.equal(result.current.isLoading, true);
      });

      // Should finish loading with sessions
      await waitFor(() => {
        assert.equal(result.current.sessions.length, 2);
      }, { timeout: 300 });
    });
  });

  describe('Session Selection', () => {
    it('should load session history when selected', async () => {
      // Setup
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });
      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: 'session-1',
        messages: [],
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open drawer
      result.current.setOpen(true);

      // Wait for sessions to load
      await waitFor(() => {
        assert.equal(result.current.sessions.length, 2);
      });

      // Select a session
      await result.current.loadSession('session-1');

      // Verify getChatHistory was called
      await waitFor(() => {
        assert.ok(vi.mocked(desktopMateAdapter.getChatHistory).mock.calls.length > 0);
        const call = vi.mocked(desktopMateAdapter.getChatHistory).mock.calls[0][0];
        assert.equal(call.session_id, 'session-1');
      });
    });

    it('should not reload already selected session', async () => {
      // Setup
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });
      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: 'session-1',
        messages: [],
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Load session first time
      await result.current.loadSession('session-1');

      await waitFor(() => {
        assert.ok(vi.mocked(desktopMateAdapter.getChatHistory).mock.calls.length > 0);
      });

      // Clear mock calls
      vi.mocked(desktopMateAdapter.getChatHistory).mockClear();

      // Try to load same session again
      await result.current.loadSession('session-1');

      // Wait a bit to ensure no new call is made
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not call getChatHistory again
      assert.equal(vi.mocked(desktopMateAdapter.getChatHistory).mock.calls.length, 0);
    });
  });

  describe('Session Creation', () => {
    it('should create new session successfully', async () => {
      // Setup
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: 'new-session-123',
        message_count: 0,
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Create new session
      await result.current.createNewSession();

      // Verify addChatHistory was called
      await waitFor(() => {
        assert.ok(vi.mocked(desktopMateAdapter.addChatHistory).mock.calls.length > 0);
        const call = vi.mocked(desktopMateAdapter.addChatHistory).mock.calls[0][0];
        assert.equal(call.user_id, 'user-1');
        assert.equal(call.agent_id, 'agent-1');
        assert.equal(call.messages?.length || 0, 0);
      });
    });

    it('should refresh session list after creation', async () => {
      // Setup
      let callCount = 0;
      vi.mocked(desktopMateAdapter.listSessions).mockImplementation(async () => {
        callCount++;
        return { sessions: callCount === 1 ? mockSessions : [...mockSessions, {
          session_id: 'new-session',
          user_id: 'user-1',
          agent_id: 'agent-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
        }] };
      });
      vi.mocked(desktopMateAdapter.addChatHistory).mockResolvedValue({
        session_id: 'new-session',
        message_count: 0,
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Create new session
      await result.current.createNewSession();

      // Verify session list was refreshed
      await waitFor(() => {
        assert.ok(callCount >= 2); // Initial load + refresh after creation
      });
    });
  });

  describe('Session Deletion', () => {
    it('should open delete confirmation dialog', async () => {
      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open delete dialog
      result.current.openDeleteDialog('session-1');

      // Verify dialog state - need to wait for state update
      await waitFor(() => {
        assert.equal(result.current.deleteDialogState.isOpen, true);
        assert.equal(result.current.deleteDialogState.sessionId, 'session-1');
      });
    });

    it('should close delete confirmation dialog', async () => {
      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open then close dialog
      result.current.openDeleteDialog('session-1');
      result.current.closeDeleteDialog();

      // Verify dialog is closed
      assert.equal(result.current.deleteDialogState.isOpen, false);
      assert.equal(result.current.deleteDialogState.sessionId, null);
    });

    it('should delete session after confirmation', async () => {
      // Setup
      vi.mocked(desktopMateAdapter.listSessions).mockResolvedValue({
        sessions: mockSessions,
      });
      vi.mocked(desktopMateAdapter.deleteSession).mockResolvedValue({
        success: true,
        message: 'Session deleted',
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open delete dialog for session-2 (not current session)
      result.current.openDeleteDialog('session-2');

      // Wait for dialog to open
      await waitFor(() => {
        assert.equal(result.current.deleteDialogState.isOpen, true);
      });

      // Confirm deletion
      await result.current.confirmDelete();

      // Verify deleteSession was called
      await waitFor(() => {
        assert.ok(vi.mocked(desktopMateAdapter.deleteSession).mock.calls.length > 0);
        const call = vi.mocked(desktopMateAdapter.deleteSession).mock.calls[0][0];
        assert.equal(call.session_id, 'session-2');
      });
    });

    it('should not delete current active session', async () => {
      // Setup
      vi.mocked(desktopMateAdapter.getChatHistory).mockResolvedValue({
        session_id: 'session-1',
        messages: [],
      });

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Load a session to make it current
      await result.current.loadSession('session-1');

      // Clear deleteSession mock
      vi.mocked(desktopMateAdapter.deleteSession).mockClear();

      // Try to delete current session
      result.current.openDeleteDialog('session-1');
      await result.current.confirmDelete();

      // Should not call deleteSession
      assert.equal(vi.mocked(desktopMateAdapter.deleteSession).mock.calls.length, 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle session loading errors', async () => {
      // Setup
      const error = new Error('Failed to load sessions');
      vi.mocked(desktopMateAdapter.listSessions).mockRejectedValue(error);

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Open drawer (triggers session load)
      result.current.setOpen(true);

      // Wait for sessions to remain empty (error was handled)
      await waitFor(() => {
        assert.equal(result.current.sessions.length, 0);
      });
    });

    it('should handle session creation errors', async () => {
      // Setup
      const error = new Error('Failed to create session');
      vi.mocked(desktopMateAdapter.addChatHistory).mockRejectedValue(error);

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Try to create session
      await result.current.createNewSession();

      // Should handle error gracefully
      await waitFor(() => {
        assert.equal(result.current.isLoading, false);
      });
    });

    it('should handle session deletion errors', async () => {
      // Setup
      const error = new Error('Failed to delete session');
      vi.mocked(desktopMateAdapter.deleteSession).mockRejectedValue(error);

      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Try to delete session
      result.current.openDeleteDialog('session-2');
      await result.current.confirmDelete();

      // Should handle error gracefully
      await waitFor(() => {
        assert.equal(result.current.isLoading, false);
      });
    });
  });

  describe('Drawer State Management', () => {
    it('should toggle drawer open/close', async () => {
      // Render hook
      const { result } = renderHook(() => useSessionDrawer(), { wrapper });

      // Initially closed
      assert.equal(result.current.open, false);

      // Open drawer
      result.current.setOpen(true);
      
      await waitFor(() => {
        assert.equal(result.current.open, true);
      });

      // Close drawer
      result.current.setOpen(false);
      
      await waitFor(() => {
        assert.equal(result.current.open, false);
      });
    });
  });
});
