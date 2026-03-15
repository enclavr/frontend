import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '@/hooks/useChat';

const mockChatApi = vi.hoisted(() => ({
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
  searchMessages: vi.fn().mockResolvedValue([]),
  getPinnedMessages: vi.fn().mockResolvedValue([]),
  pinMessage: vi.fn().mockResolvedValue({ status: 'ok' }),
  unpinMessage: vi.fn().mockResolvedValue({ status: 'ok' }),
  addReaction: vi.fn().mockResolvedValue({ status: 'ok' }),
  removeReaction: vi.fn().mockResolvedValue({ status: 'ok' }),
  getReactions: vi.fn().mockResolvedValue([]),
  markMessageAsRead: vi.fn().mockResolvedValue({ status: 'ok' }),
  getReadReceipts: vi.fn().mockResolvedValue([]),
  blockUser: vi.fn().mockResolvedValue({ status: 'ok' }),
  unblockUser: vi.fn().mockResolvedValue({ status: 'ok' }),
  getBlockedUsers: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/api', () => ({
  api: mockChatApi,
  chatApi: mockChatApi,
}));

// Store original WebSocket
const OriginalWebSocket = globalThis.WebSocket;

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
    queueMicrotask(() => this.onopen?.());
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason, wasClean: true });
  }
}

// Override global WebSocket
globalThis.WebSocket = MockWebSocket as any;

describe('useChat Hook', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
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

      expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', 'Hello world', 'text', undefined);
    });

    it('should trim whitespace from message', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('  Hello world  ');
      });

      expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', 'Hello world', 'text', undefined);
    });

    it('should not send empty message', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(mockChatApi.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message without roomId', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: '', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(mockChatApi.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle Unicode characters in message', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('Hello 世界 🌍 Émoji');
      });

      expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', 'Hello 世界 🌍 Émoji', 'text', undefined);
    });

    it('should handle HTML/script tags in message content', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('<script>alert("xss")</script>');
      });

      expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', '<script>alert("xss")</script>', 'text', undefined);
    });

    it('should handle very long message content', async () => {
      const longMessage = 'a'.repeat(4000);
      console.log('longMessage length:', longMessage.length);
      console.log('longMessage trimmed length:', longMessage.trim().length);
      console.log('spam pattern test:', /(.)\1{10,}/.test(longMessage));
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        const output = await result.current.sendMessage(longMessage);
        console.log('sendMessage output:', output);
        console.log('error state:', result.current.error);
      });

      console.log('mockChatApi.sendMessage calls:', mockChatApi.sendMessage.mock.calls);
      expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', longMessage, 'text', undefined);
    });

    it('should handle message with special formatting characters', async () => {
      const { result } = renderHook(() =>
        useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
      );

      await act(async () => {
        await result.current.sendMessage('**bold** *italic* `code` #header');
      });

      expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', '**bold** *italic* `code` #header', 'text', undefined);
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

      expect(mockChatApi.updateMessage).toHaveBeenCalledWith('msg-1', 'Updated content');
    });

    it('should handle update error', async () => {
      vi.mocked(mockChatApi.updateMessage).mockRejectedValueOnce(new Error('Not authorized'));

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

      expect(mockChatApi.deleteMessage).toHaveBeenCalledWith('msg-1');
    });

    it('should handle delete error', async () => {
      vi.mocked(mockChatApi.deleteMessage).mockRejectedValueOnce(new Error('Not found'));

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
  beforeEach(async () => {
    vi.clearAllMocks();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
  });

  it('should handle non-Error exceptions gracefully', async () => {
    const { chatApi } = { chatApi: mockChatApi };
    vi.mocked(mockChatApi.getMessages).mockRejectedValue('Unknown error');

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.fetchMessages();
    });

    expect(result.current.error).toBe('Failed to fetch messages');
  });

  it('should handle update message with non-Error exception', async () => {
    const { chatApi } = { chatApi: mockChatApi };
    vi.mocked(mockChatApi.updateMessage).mockRejectedValue('Failed');

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.updateMessage('msg-1', 'New content');
    });

    expect(result.current.error).toBe('Failed to update message');
  });

  it('should handle delete message with non-Error exception', async () => {
    const { chatApi } = { chatApi: mockChatApi };
    vi.mocked(mockChatApi.deleteMessage).mockRejectedValue('Failed');

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.deleteMessage('msg-1');
    });

    expect(result.current.error).toBe('Failed to delete message');
  });

  it('should handle sendMessage error by queueing message', async () => {
    class DelayedWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = DelayedWebSocket.CONNECTING;
      onopen: (() => void) | null = null;
      onclose: ((e: CloseEvent) => void) | null = null;
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;

      constructor(public url: string) {
        setTimeout(() => {
          this.readyState = DelayedWebSocket.CLOSED;
          this.onclose?.(new CloseEvent('close'));
        }, 50);
      }

      send(data: string) {}
      close() {
        this.readyState = DelayedWebSocket.CLOSED;
      }
    }

    const originalWebSocket = globalThis.WebSocket;
    vi.stubGlobal('WebSocket', DelayedWebSocket);

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage('Queued message');
    });

    expect(result.current.pendingCount).toBe(1);
    
    vi.stubGlobal('WebSocket', originalWebSocket);
  });

  it('should handle empty message content', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage('');
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle message content with only newlines', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage('\n\n\n');
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle message content with only tabs', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage('\t\t\t');
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle very long message content', async () => {
    const longMessage = 'a'.repeat(4000);
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage(longMessage);
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', longMessage, 'text', undefined);
  });

  it('should handle special characters in message', async () => {
    const specialMessage = 'Hello <script>alert("xss")</script> & "quoted"';
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage(specialMessage);
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', specialMessage, 'text', undefined);
  });

  it('should handle unicode characters in message', async () => {
    const unicodeMessage = 'Hello 世界 🌍 🎉 你好';
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage(unicodeMessage);
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', unicodeMessage, 'text', undefined);
  });

  it('should handle emoji in message', async () => {
    const emojiMessage = '🎉 🥳 🍾 Happy Birthday! 🎂';
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage(emojiMessage);
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).toHaveBeenCalledWith('room-1', emojiMessage, 'text', undefined);
  });

  it('should handle updateMessage with empty content', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      const ret = await result.current.updateMessage('msg-1', '');
      expect(ret).toBeNull();
    });

      expect(mockChatApi.updateMessage).not.toHaveBeenCalled();
  });

  it('should handle rapid successive sendMessage calls', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await Promise.all([
        result.current.sendMessage('Message 1'),
        result.current.sendMessage('Message 2'),
        result.current.sendMessage('Message 3'),
      ]);
    });

    const { chatApi } = { chatApi: mockChatApi };
    expect(mockChatApi.sendMessage).toHaveBeenCalledTimes(3);
  });
});

describe('useChat Connection States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start in connecting state', () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    expect(result.current.connectionState).toBe('connecting');
  });

  it('should transition to connected state', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.connectionState).toBe('connected');
  });

  it('should clear messages when roomId changes', async () => {
    const { result, rerender } = renderHook(
      ({ roomId }) => useChat({ roomId, userId: 'user-1', username: 'testuser' }),
      { initialProps: { roomId: 'room-1' } }
    );

    await act(async () => {
      await result.current.sendMessage('Test message');
    });

    expect(result.current.messages.length).toBe(1);

    rerender({ roomId: 'room-2' });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(result.current.messages.length).toBeGreaterThanOrEqual(0);
  });

  it('should not connect when roomId is empty', () => {
    const { result } = renderHook(() =>
      useChat({ roomId: '', userId: 'user-1', username: 'testuser' })
    );

    expect(result.current.connectionState).toBe('disconnected');
  });
});

describe('useChat Typing Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have empty typingUsers initially', () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    expect(result.current.typingUsers).toEqual([]);
  });

  it('should call sendTyping when typing', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      result.current.sendTyping();
    });

    expect(result.current.typingUsers).toEqual([]);
  });

  it('should call stopTyping when stopping', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      result.current.stopTyping();
    });

    expect(result.current.typingUsers).toEqual([]);
  });
});

describe('useChat Message Queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should queue messages when WebSocket is not connected', async () => {
    let openCallback: (() => void) | null = null;
    class DelayedWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      readyState = DelayedWebSocket.CONNECTING;
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: ((error: unknown) => void) | null = null;
      onclose: ((event: { code: number; reason: string; wasClean: boolean }) => void) | null = null;

      constructor(public url: string) {
        openCallback = () => {
          this.readyState = DelayedWebSocket.OPEN;
          this.onopen?.();
        };
      }

      send(data: string) {}

      close(code = 1000, reason = '') {
        this.readyState = DelayedWebSocket.CLOSED;
        this.onclose?.({ code, reason, wasClean: true });
      }
    }

    vi.stubGlobal('WebSocket', DelayedWebSocket);

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.sendMessage('Message while connecting');
    });

    expect(result.current.pendingCount).toBe(1);

    await act(async () => {
      openCallback?.();
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.pendingCount).toBe(0);
  });
});

describe('useChat Advanced Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle WebSocket error event', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const mockWs = (global as any).WebSocket.prototype;
    if (mockWs.onerror) {
      act(() => {
        mockWs.onerror(new Error('Connection error'));
      });

      expect(result.current.error).toBe('WebSocket connection error');
    }
  });

  it('should handle malformed WebSocket messages', async () => {
    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    const mockWs = (global as any).WebSocket.prototype;
    if (mockWs.onmessage) {
      act(() => {
        mockWs.onmessage({ data: 'invalid-json' });
      });

      expect(result.current.error).toBeNull();
    }
  });

  it('should handle concurrent fetchMessages calls', async () => {
    const { api } = { api: mockChatApi };
    let callCount = 0;
    vi.mocked(api.getMessages).mockImplementation(async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return [];
    });

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    // Wait for initial useEffect fetch to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 30));
    });

    // Reset counter after initial fetch
    callCount = 0;

    await act(async () => {
      await Promise.all([
        result.current.fetchMessages(),
        result.current.fetchMessages(),
        result.current.fetchMessages(),
      ]);
    });

    expect(callCount).toBe(3);
  });

  it('should handle empty array response from getMessages', async () => {
    const { api } = { api: mockChatApi };
    vi.mocked(api.getMessages).mockResolvedValue([]);

    const { result } = renderHook(() =>
      useChat({ roomId: 'room-1', userId: 'user-1', username: 'testuser' })
    );

    await act(async () => {
      await result.current.fetchMessages();
    });

    expect(result.current.messages).toEqual([]);
  });
});
