import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuthStore, useRoomStore } from '@/lib/store';

vi.mock('@/lib/api', () => ({
  api: {
    login: vi.fn().mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: '',
        is_admin: false,
      },
    }),
    register: vi.fn().mockResolvedValue({
      access_token: 'test-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: '',
        is_admin: false,
      },
    }),
    setToken: vi.fn(),
    getRooms: vi.fn().mockResolvedValue([
      { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 },
      { id: 'room-2', name: 'Room 2', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 10 },
    ]),
    createRoom: vi.fn().mockResolvedValue({
      id: 'room-3',
      name: 'New Room',
      description: '',
      is_private: false,
      max_users: 50,
      created_by: 'user-1',
      created_at: '2026-02-26T12:00:00Z',
      user_count: 1,
    }),
    getRoom: vi.fn().mockResolvedValue({
      id: 'room-1',
      name: 'Room 1',
      description: '',
      is_private: false,
      max_users: 50,
      created_by: 'user-1',
      created_at: '2026-02-26T10:00:00Z',
      user_count: 6,
    }),
    joinRoom: vi.fn().mockResolvedValue({ status: 'ok' }),
    leaveRoom: vi.fn().mockResolvedValue({ status: 'ok' }),
  },
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  });

  describe('initial state', () => {
    it('should have null user on initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('testuser', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.username).toBe('testuser');
      expect(result.current.token).toBe('test-token');
    });

    it('should handle login failure gracefully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.login).mockRejectedValueOnce(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login('testuser', 'wrongpassword');
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('testuser', 'test@example.com', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeDefined();
      expect(result.current.user?.email).toBe('test@example.com');
    });
  });

  describe('logout', () => {
    it('should logout and clear state', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('testuser', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBe(null);
      expect(result.current.token).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should manually set user', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        display_name: 'Test User',
        avatar_url: '',
        is_admin: false,
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });
});

describe('useRoomStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRoomStore.setState({
      rooms: [],
      currentRoom: null,
    });
  });

  describe('initial state', () => {
    it('should have empty rooms array', () => {
      const { result } = renderHook(() => useRoomStore());
      expect(result.current.rooms).toEqual([]);
      expect(result.current.currentRoom).toBe(null);
    });
  });

  describe('fetchRooms', () => {
    it('should fetch rooms successfully', async () => {
      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.fetchRooms();
      });

      expect(result.current.rooms.length).toBe(2);
      expect(result.current.rooms[0].name).toBe('Room 1');
    });

    it('should handle empty rooms list', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getRooms).mockResolvedValueOnce([]);

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.fetchRooms();
      });

      expect(result.current.rooms).toEqual([]);
    });
  });

  describe('createRoom', () => {
    it('should create room and add to list', async () => {
      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.createRoom('New Room');
      });

      expect(result.current.rooms.length).toBe(1);
      expect(result.current.rooms[0].name).toBe('New Room');
    });

    it('should create room with description', async () => {
      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.createRoom('New Room', 'A description');
      });

      expect(result.current.rooms[0].name).toBe('New Room');
    });

    it('should create private room with password', async () => {
      const { api } = await import('@/lib/api');
      const originalCreateRoom = api.createRoom;
      api.createRoom = vi.fn().mockResolvedValueOnce({
        id: 'room-private',
        name: 'Private Room',
        description: 'Secret room',
        is_private: true,
        max_users: 10,
        created_by: 'user-1',
        created_at: '2026-02-26T12:00:00Z',
        user_count: 1,
      });

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.createRoom('Private Room', 'Secret room', 'password123');
      });

      expect(result.current.rooms[0].name).toBe('Private Room');
      api.createRoom = originalCreateRoom;
    });
  });

  describe('joinRoom', () => {
    it('should join room and set as current', async () => {
      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.joinRoom('room-1');
      });

      expect(result.current.currentRoom).toBeDefined();
      expect(result.current.currentRoom?.id).toBe('room-1');
      expect(result.current.currentRoom?.user_count).toBe(6);
    });

    it('should join room with password', async () => {
      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.joinRoom('room-1', 'password123');
      });

      expect(result.current.currentRoom).toBeDefined();
    });

    it('should update room in list when joining', async () => {
      useRoomStore.setState({
        rooms: [
          { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 },
        ],
        currentRoom: null,
      });

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.joinRoom('room-1');
      });

      expect(result.current.rooms[0].user_count).toBe(6);
    });
  });

  describe('leaveRoom', () => {
    it('should leave room and clear current', async () => {
      useRoomStore.setState({
        rooms: [
          { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 },
        ],
        currentRoom: { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 },
      });

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.leaveRoom('room-1');
      });

      expect(result.current.currentRoom).toBe(null);
      expect(result.current.rooms[0].user_count).toBe(4);
    });

    it('should handle leaving room with zero users', async () => {
      useRoomStore.setState({
        rooms: [
          { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 0 },
        ],
        currentRoom: { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 0 },
      });

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.leaveRoom('room-1');
      });

      expect(result.current.rooms[0].user_count).toBe(0);
    });
  });

  describe('setCurrentRoom', () => {
    it('should set current room', () => {
      const { result } = renderHook(() => useRoomStore());

      const room = {
        id: 'room-1',
        name: 'Room 1',
        description: '',
        is_private: false,
        max_users: 50,
        created_by: 'user-1',
        created_at: '2026-02-26T10:00:00Z',
        user_count: 5,
      };

      act(() => {
        result.current.setCurrentRoom(room);
      });

      expect(result.current.currentRoom).toEqual(room);
    });

    it('should clear current room when null', () => {
      useRoomStore.setState({
        rooms: [],
        currentRoom: { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 },
      });

      const { result } = renderHook(() => useRoomStore());

      act(() => {
        result.current.setCurrentRoom(null);
      });

      expect(result.current.currentRoom).toBe(null);
    });
  });

  describe('Room Store Edge Cases', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      useRoomStore.setState({
        rooms: [],
        currentRoom: null,
      });
    });

    it('should handle joinRoom failure gracefully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.joinRoom).mockRejectedValueOnce(new Error('Room is full'));

      const { result } = renderHook(() => useRoomStore());

      await expect(
        act(async () => {
          await result.current.joinRoom('room-full');
        })
      ).rejects.toThrow('Room is full');
    });

    it('should handle fetchRooms failure gracefully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getRooms).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useRoomStore());

      await expect(
        act(async () => {
          await result.current.fetchRooms();
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle createRoom failure gracefully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.createRoom).mockRejectedValueOnce(new Error('Name taken'));

      const { result } = renderHook(() => useRoomStore());

      await expect(
        act(async () => {
          await result.current.createRoom('Existing Room');
        })
      ).rejects.toThrow('Name taken');
    });

    it('should handle leaveRoom failure gracefully', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.leaveRoom).mockRejectedValueOnce(new Error('Not in room'));

      useRoomStore.setState({
        rooms: [{ id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 }],
        currentRoom: { id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 },
      });

      const { result } = renderHook(() => useRoomStore());

      await expect(
        act(async () => {
          await result.current.leaveRoom('room-1');
        })
      ).rejects.toThrow('Not in room');
    });

    it('should preserve existing rooms when creating new room', async () => {
      useRoomStore.setState({
        rooms: [{ id: 'existing', name: 'Existing Room', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 5 }],
        currentRoom: null,
      });

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.createRoom('New Room');
      });

      expect(result.current.rooms.length).toBe(2);
      expect(result.current.rooms.find(r => r.name === 'Existing Room')).toBeDefined();
    });

    it('should handle concurrent room operations', async () => {
      const { api } = await import('@/lib/api');
      
      vi.mocked(api.createRoom)
        .mockResolvedValueOnce({ id: 'room-1', name: 'Room 1', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T10:00:00Z', user_count: 1 })
        .mockResolvedValueOnce({ id: 'room-2', name: 'Room 2', description: '', is_private: false, max_users: 50, created_by: 'user-1', created_at: '2026-02-26T11:00:00Z', user_count: 1 });

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await Promise.all([
          result.current.createRoom('Room 1'),
          result.current.createRoom('Room 2'),
        ]);
      });

      expect(result.current.rooms.length).toBe(2);
    });

    it('should handle room with maximum user count', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.getRoom).mockResolvedValueOnce({
        id: 'room-1',
        name: 'Full Room',
        description: '',
        is_private: false,
        max_users: 50,
        created_by: 'user-1',
        created_at: '2026-02-26T10:00:00Z',
        user_count: 50,
      });

      const { result } = renderHook(() => useRoomStore());

      await act(async () => {
        await result.current.joinRoom('room-1');
      });

      expect(result.current.currentRoom?.user_count).toBe(50);
    });
  });

  describe('Auth Store Edge Cases', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      localStorage.clear();
      useAuthStore.setState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    });

    it('should handle login with network error', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.login).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login('user', 'pass');
        })
      ).rejects.toThrow('Network error');
      
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle register with network error', async () => {
      const { api } = await import('@/lib/api');
      vi.mocked(api.register).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.register('user', 'email@test.com', 'pass');
        })
      ).rejects.toThrow('Network error');
      
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should persist state correctly', () => {
      useAuthStore.setState({
        user: { id: '1', username: 'test', email: 'test@test.com', display_name: 'Test', avatar_url: '', is_admin: false },
        token: 'test-token',
        refreshToken: 'refresh-token',
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuthStore());
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('test-token');
    });

    it('should handle setUser without authentication', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const newUser = { id: '2', username: 'newuser', email: 'new@test.com', display_name: 'New User', avatar_url: '', is_admin: false };
      
      act(() => {
        result.current.setUser(newUser);
      });

      expect(result.current.user).toEqual(newUser);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear tokens on logout but preserve user state temporarily', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('testuser', 'password');
      });

      expect(result.current.token).toBe('test-token');

      act(() => {
        result.current.logout();
      });

      expect(result.current.token).toBe(null);
      expect(result.current.refreshToken).toBe(null);
    });
  });
});
