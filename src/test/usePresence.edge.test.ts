import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePresence } from '@/hooks/usePresence';

vi.mock('@/lib/api', () => ({
  api: {
    getRoomPresence: vi.fn().mockResolvedValue([]),
    updatePresence: vi.fn().mockResolvedValue({}),
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

  constructor(public url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    // no-op
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason, wasClean: true });
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

describe('usePresence Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have empty presences array initially', () => {
      const { result } = renderHook(() =>
        usePresence({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      expect(result.current.presences).toEqual([]);
    });

    it('should have null error initially', () => {
      const { result } = renderHook(() =>
        usePresence({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      expect(result.current.error).toBeNull();
    });

    it('should expose required functions', () => {
      const { result } = renderHook(() =>
        usePresence({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      expect(result.current.updatePresence).toBeDefined();
      expect(result.current.fetchPresence).toBeDefined();
    });
  });

  describe('updatePresence', () => {
    it('should call API to update presence', async () => {
      const { result } = renderHook(() =>
        usePresence({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.updatePresence('online');
      });

      const { api } = await import('@/lib/api');
      expect(api.updatePresence).toHaveBeenCalledWith('online', 'room-1');
    });

    it('should handle updatePresence without roomId', async () => {
      const { result } = renderHook(() =>
        usePresence({ roomId: '', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.updatePresence('away');
      });

      const { api } = await import('@/lib/api');
      expect(api.updatePresence).toHaveBeenCalledWith('away', undefined);
    });
  });

  describe('fetchPresence', () => {
    it('should handle API error', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getRoomPresence).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        usePresence({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.fetchPresence();
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getRoomPresence).mockRejectedValueOnce('Unknown error');

      const { result } = renderHook(() =>
        usePresence({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.fetchPresence();
      });

      expect(result.current.error).toBe('Failed to fetch presence');
    });
  });
});

describe('usePresence Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle presence with all status types', async () => {
    const statuses: Array<'online' | 'away' | 'busy' | 'offline'> = ['online', 'away', 'busy', 'offline'];
    
    for (const status of statuses) {
      const { result } = renderHook(() =>
        usePresence({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.updatePresence(status);
      });

      const { api } = await import('@/lib/api');
      expect(api.updatePresence).toHaveBeenCalledWith(status, 'room-1');
    }
  });

  it('should handle empty roomId for fetchPresence', async () => {
    const { result } = renderHook(() =>
      usePresence({ roomId: '', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.fetchPresence();
    });

    const { api } = await import('@/lib/api');
    expect(api.getRoomPresence).not.toHaveBeenCalled();
  });
});
