import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDM } from '@/hooks/useDM';

vi.mock('@/lib/api', () => ({
  api: {
    getConversations: vi.fn().mockResolvedValue([]),
    getDMMessages: vi.fn().mockResolvedValue([]),
    sendDM: vi.fn(),
    updateDM: vi.fn(),
    deleteDM: vi.fn(),
  },
}));

describe('useDM Hook - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchConversations', () => {
    it('should handle empty conversations list', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getConversations).mockResolvedValueOnce([]);
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should handle API error gracefully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getConversations).mockRejectedValueOnce(
        new Error('Network error')
      );
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.conversations).toEqual([]);
    });

    it('should handle non-Error exceptions', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getConversations).mockRejectedValueOnce('Unknown error');
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.error).toBe('Failed to fetch conversations');
    });
  });

  describe('fetchMessages', () => {
    it('should handle empty messages list', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getDMMessages).mockResolvedValueOnce([]);
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.fetchMessages('other-user');
      });

      expect(result.current.messages).toEqual([]);
    });

    it('should handle API error when fetching messages', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getDMMessages).mockRejectedValueOnce(
        new Error('Server error')
      );
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.fetchMessages('other-user');
      });

      expect(result.current.error).toBe('Server error');
    });
  });

  describe('sendMessage', () => {
    it('should handle send message when API rejects', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM).mockRejectedValueOnce(
        new Error('Failed to send')
      );

      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      let errorCaught = false;
      try {
        await act(async () => {
          await result.current.sendMessage('user-2', 'Hello');
        });
      } catch {
        errorCaught = true;
      }
      
      expect(errorCaught).toBe(true);
    });
  });

  describe('initial state', () => {
    it('should have empty state when no userId', () => {
      const { result } = renderHook(() => useDM({ userId: '' }));
      
      expect(result.current.conversations).toEqual([]);
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should expose fetchConversations function', async () => {
      const { result } = renderHook(() => useDM({ userId: '' }));
      
      expect(result.current.fetchConversations).toBeDefined();
      expect(typeof result.current.fetchConversations).toBe('function');
    });

    it('should expose fetchMessages function', async () => {
      const { result } = renderHook(() => useDM({ userId: '' }));
      
      expect(result.current.fetchMessages).toBeDefined();
      expect(typeof result.current.fetchMessages).toBe('function');
    });

    it('should expose sendMessage function', async () => {
      const { result } = renderHook(() => useDM({ userId: '' }));
      
      expect(result.current.sendMessage).toBeDefined();
      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should expose updateMessage function', async () => {
      const { result } = renderHook(() => useDM({ userId: '' }));
      
      expect(result.current.updateMessage).toBeDefined();
      expect(typeof result.current.updateMessage).toBe('function');
    });

    it('should expose deleteMessage function', async () => {
      const { result } = renderHook(() => useDM({ userId: '' }));
      
      expect(result.current.deleteMessage).toBeDefined();
      expect(typeof result.current.deleteMessage).toBe('function');
    });
  });
});
