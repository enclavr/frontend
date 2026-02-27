import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { User, Room } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(username, password);
          api.setToken(response.access_token);
          set({
            user: response.user,
            token: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login failed',
          });
          throw err;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.register(username, email, password);
          api.setToken(response.access_token);
          set({
            user: response.user,
            token: response.access_token,
            refreshToken: response.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Registration failed',
          });
          throw err;
        }
      },

      logout: () => {
        api.setToken(null);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      setUser: (user: User) => set({ user }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, description?: string, password?: string, categoryId?: string) => Promise<Room>;
  joinRoom: (roomId: string, password?: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: Room | null) => void;
  clearError: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const rooms = await api.getRooms();
      set({ rooms, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch rooms',
      });
      throw err;
    }
  },

  createRoom: async (name: string, description?: string, password?: string, categoryId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.createRoom({ name, description, password, category_id: categoryId });
      set((state) => ({ rooms: [...state.rooms, room], isLoading: false }));
      return room;
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to create room',
      });
      throw err;
    }
  },

  joinRoom: async (roomId: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.joinRoom(roomId, password);
      const room = await api.getRoom(roomId);
      set((state) => ({
        currentRoom: room,
        rooms: state.rooms.map((r) => (r.id === roomId ? room : r)),
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to join room',
      });
      throw err;
    }
  },

  leaveRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.leaveRoom(roomId);
      set((state) => ({
        currentRoom: null,
        rooms: state.rooms.map((r) =>
          r.id === roomId ? { ...r, user_count: Math.max(0, r.user_count - 1) } : r
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to leave room',
      });
      throw err;
    }
  },

  setCurrentRoom: (room: Room | null) => set({ currentRoom: room }),

  clearError: () => set({ error: null }),
}));
