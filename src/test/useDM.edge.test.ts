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

  describe('updateMessage', () => {
    it('should handle update message successfully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.updateDM).mockResolvedValueOnce({
        id: 'msg-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Updated message',
        is_edited: true,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:05:00Z',
        sender: {} as never,
        receiver: {} as never,
      });

      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.updateMessage('msg-1', 'Updated message');
      });

      expect(api.updateDM).toHaveBeenCalledWith('msg-1', 'Updated message');
    });

    it('should handle update error', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.updateDM).mockRejectedValueOnce(new Error('Not authorized'));

      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      let errorCaught = false;
      try {
        await act(async () => {
          await result.current.updateMessage('msg-1', 'New content');
        });
      } catch {
        errorCaught = true;
      }

      expect(errorCaught).toBe(true);
    });

    it('should handle non-Error exception', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.updateDM).mockRejectedValueOnce('Failed');

      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      let errorCaught = false;
      try {
        await act(async () => {
          await result.current.updateMessage('msg-1', 'Content');
        });
      } catch {
        errorCaught = true;
      }

      expect(errorCaught).toBe(true);
    });
  });

  describe('deleteMessage', () => {
    it('should handle delete message successfully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.deleteDM).mockResolvedValueOnce({ status: 'ok' });

      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(api.deleteDM).toHaveBeenCalledWith('msg-1');
    });

    it('should handle delete error', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.deleteDM).mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      let errorCaught = false;
      try {
        await act(async () => {
          await result.current.deleteMessage('msg-1');
        });
      } catch {
        errorCaught = true;
      }

      expect(errorCaught).toBe(true);
    });
  });

  describe('message content edge cases', () => {
    it('should handle empty message content', async () => {
      const { api } = await import('@/lib/api');
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      let errorCaught = false;
      try {
        await act(async () => {
          await result.current.sendMessage('user-2', '');
        });
      } catch {
        errorCaught = false;
      }

      expect(api.sendDM).toHaveBeenCalledWith('user-2', '');
    });

    it('should handle message with only whitespace', async () => {
      const { api } = await import('@/lib/api');
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.sendMessage('user-2', '   ');
      });

      expect(api.sendDM).toHaveBeenCalledWith('user-2', '   ');
    });

    it('should handle special characters in message', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM).mockResolvedValueOnce({
        id: 'msg-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Special <>&" characters',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
        sender: {} as never,
        receiver: {} as never,
      });
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.sendMessage('user-2', 'Special <>&" characters');
      });

      expect(api.sendDM).toHaveBeenCalledWith('user-2', 'Special <>&" characters');
    });
  });

  describe('rapid operations', () => {
    it('should handle rapid fetchMessages calls', async () => {
      const { api } = await import('@/lib/api');
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await Promise.all([
          result.current.fetchMessages('user-2'),
          result.current.fetchMessages('user-3'),
          result.current.fetchMessages('user-4'),
        ]);
      });

      expect(api.getDMMessages).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid sendMessage calls', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM)
        .mockResolvedValueOnce({ id: 'msg-1', sender_id: 'user-1', receiver_id: 'user-2', content: 'Hi', is_edited: false, is_deleted: false, created_at: '', updated_at: '', sender: {} as never, receiver: {} as never })
        .mockResolvedValueOnce({ id: 'msg-2', sender_id: 'user-1', receiver_id: 'user-2', content: 'Hello', is_edited: false, is_deleted: false, created_at: '', updated_at: '', sender: {} as never, receiver: {} as never });
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await Promise.all([
          result.current.sendMessage('user-2', 'Hi'),
          result.current.sendMessage('user-2', 'Hello'),
        ]);
      });

      expect(api.sendDM).toHaveBeenCalledTimes(2);
    });

    it('should handle Unicode characters in message', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM).mockResolvedValueOnce({
        id: 'msg-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Hello 世界 🌍',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
        sender: {} as never,
        receiver: {} as never,
      });
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.sendMessage('user-2', 'Hello 世界 🌍');
      });

      expect(api.sendDM).toHaveBeenCalledWith('user-2', 'Hello 世界 🌍');
    });

    it('should handle very long message content', async () => {
      const longMessage = 'a'.repeat(10000);
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM).mockResolvedValueOnce({
        id: 'msg-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: longMessage,
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
        sender: {} as never,
        receiver: {} as never,
      });
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.sendMessage('user-2', longMessage);
      });

      expect(api.sendDM).toHaveBeenCalledWith('user-2', longMessage);
    });

    it('should handle message with emoji', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM).mockResolvedValueOnce({
        id: 'msg-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: '🎉🥳🍾 Happy Birthday! 🎂',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
        sender: {} as never,
        receiver: {} as never,
      });
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.sendMessage('user-2', '🎉🥳🍾 Happy Birthday! 🎂');
      });

      expect(api.sendDM).toHaveBeenCalledWith('user-2', '🎉🥳🍾 Happy Birthday! 🎂');
    });

    it('should handle newlines in message content', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM).mockResolvedValueOnce({
        id: 'msg-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        content: 'Line 1\nLine 2\nLine 3',
        is_edited: false,
        is_deleted: false,
        created_at: '2026-02-26T10:00:00Z',
        updated_at: '2026-02-26T10:00:00Z',
        sender: {} as never,
        receiver: {} as never,
      });
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.sendMessage('user-2', 'Line 1\nLine 2\nLine 3');
      });

      expect(api.sendDM).toHaveBeenCalledWith('user-2', 'Line 1\nLine 2\nLine 3');
    });
  });

  describe('conversations edge cases', () => {
    it('should handle conversation with no unread messages', async () => {
      const { api } = await import('@/lib/api');
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      await act(async () => {
        await result.current.fetchConversations();
      });

      expect(result.current.conversations).toEqual([]);
    });

    it('should handle empty receiver id', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.sendDM).mockRejectedValueOnce(new Error('Receiver ID required'));
      
      const { result } = renderHook(() => useDM({ userId: 'user-1' }));

      let errorCaught = false;
      try {
        await act(async () => {
          await result.current.sendMessage('', 'Hello');
        });
      } catch {
        errorCaught = true;
      }

      expect(errorCaught).toBe(true);
      expect(api.sendDM).toHaveBeenCalledWith('', 'Hello');
    });
  });
});
