import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';

vi.mock('@/lib/api', () => ({
  api: {
    getMessages: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue({
      id: 'msg-1',
      room_id: 'room-1',
      user_id: 'user-1',
      username: 'testuser',
      type: 'text',
      content: 'Test message',
      is_edited: false,
      is_deleted: false,
      created_at: '2026-02-26T10:00:00Z',
    }),
    updateMessage: vi.fn().mockResolvedValue({
      id: 'msg-1',
      room_id: 'room-1',
      user_id: 'user-1',
      username: 'testuser',
      type: 'text',
      content: 'Updated content',
      is_edited: true,
      is_deleted: false,
      created_at: '2026-02-26T10:00:00Z',
      updated_at: '2026-02-26T10:05:00Z',
    }),
    deleteMessage: vi.fn().mockResolvedValue({ status: 'ok' }),
  },
}));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  onclose: ((event: { code: number; reason: string; wasClean: boolean }) => void) | null = null;

  sentMessages: string[] = [];

  constructor(public url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason, wasClean: true });
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('useChat Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should expose all required functions', () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      expect(result.current.sendMessage).toBeDefined();
      expect(result.current.updateMessage).toBeDefined();
      expect(result.current.deleteMessage).toBeDefined();
      expect(result.current.sendTyping).toBeDefined();
      expect(result.current.stopTyping).toBeDefined();
      expect(result.current.fetchMessages).toBeDefined();
      expect(result.current.reconnect).toBeDefined();
    });
  });

  describe('sendMessage', () => {
    it('should send message via API', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('Hello world');
      });

      const { api } = await import('@/lib/api');
      expect(api.sendMessage).toHaveBeenCalledWith('room-1', 'Hello world');
    });

    it('should trim whitespace from message', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('  Hello world  ');
      });

      const { api } = await import('@/lib/api');
      expect(api.sendMessage).toHaveBeenCalledWith('room-1', 'Hello world');
    });

    it('should not send empty message', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      const { api } = await import('@/lib/api');
      expect(api.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message without roomId', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: '', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      const { api } = await import('@/lib/api');
      expect(api.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('updateMessage', () => {
    it('should update message via API', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.updateMessage('msg-1', 'Updated content');
      });

      const { api } = await import('@/lib/api');
      expect(api.updateMessage).toHaveBeenCalledWith('msg-1', 'Updated content');
    });

    it('should handle update error', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.updateMessage).mockRejectedValueOnce(new Error('Not authorized'));

      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.updateMessage('msg-1', 'New content');
      });

      expect(result.current.error).toBe('Not authorized');
    });
  });

  describe('deleteMessage', () => {
    it('should delete message via API', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      const { api } = await import('@/lib/api');
      expect(api.deleteMessage).toHaveBeenCalledWith('msg-1');
    });

    it('should handle delete error', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.deleteMessage).mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.deleteMessage('msg-1');
      });

      expect(result.current.error).toBe('Not found');
    });
  });
});

describe('useChat Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle non-Error exceptions gracefully', async () => {
    const { api } = await import('@/lib/api');
    vi.mocked(api.getMessages).mockRejectedValue('Unknown error');

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.fetchMessages();
    });

    expect(result.current.error).toBe('Failed to fetch messages');
  });

  it('should handle update message with non-Error exception', async () => {
    const { api } = await import('@/lib/api');
    vi.mocked(api.updateMessage).mockRejectedValue('Failed');

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.updateMessage('msg-1', 'New content');
    });

    expect(result.current.error).toBe('Failed to update message');
  });

  it('should handle delete message with non-Error exception', async () => {
    const { api } = await import('@/lib/api');
    vi.mocked(api.deleteMessage).mockRejectedValue('Failed');

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.deleteMessage('msg-1');
    });

    expect(result.current.error).toBe('Failed to delete message');
  });
});
