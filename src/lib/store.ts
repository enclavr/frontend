import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { User, Room } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        const response = await api.login(username, password);
        api.setToken(response.access_token);
        set({
          user: response.user,
          token: response.access_token,
          refreshToken: response.refresh_token,
          isAuthenticated: true,
        });
      },

      register: async (username: string, email: string, password: string) => {
        const response = await api.register(username, email, password);
        api.setToken(response.access_token);
        set({
          user: response.user,
          token: response.access_token,
          refreshToken: response.refresh_token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        api.setToken(null);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => set({ user }),
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
  fetchRooms: () => Promise<void>;
  createRoom: (name: string, description?: string, password?: string) => Promise<Room>;
  joinRoom: (roomId: string, password?: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: Room | null) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,

  fetchRooms: async () => {
    const rooms = await api.getRooms();
    set({ rooms });
  },

  createRoom: async (name: string, description?: string, password?: string) => {
    const room = await api.createRoom({ name, description, password });
    set((state) => ({ rooms: [...state.rooms, room] }));
    return room;
  },

  joinRoom: async (roomId: string, password?: string) => {
    await api.joinRoom(roomId, password);
    const room = await api.getRoom(roomId);
    set((state) => ({
      currentRoom: room,
      rooms: state.rooms.map((r) => (r.id === roomId ? room : r)),
    }));
  },

  leaveRoom: async (roomId: string) => {
    await api.leaveRoom(roomId);
    set((state) => ({
      currentRoom: null,
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, user_count: Math.max(0, r.user_count - 1) } : r
      ),
    }));
  },

  setCurrentRoom: (room: Room | null) => set({ currentRoom: room }),
}));
