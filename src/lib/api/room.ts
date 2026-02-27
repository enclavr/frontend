import { BaseApiClient } from './base';
import type { Room, RoomCreate, Category, ICEConfig, Invite, Role, RoomMember } from '@/types';

export class RoomApi extends BaseApiClient {
  async getRooms(): Promise<Room[]> {
    return this.request<Room[]>('/api/rooms');
  }

  async getRoom(id: string): Promise<Room> {
    return this.request<Room>(`/api/room?id=${id}`);
  }

  async createRoom(room: RoomCreate): Promise<Room> {
    return this.request<Room>('/api/room/create', {
      method: 'POST',
      body: JSON.stringify(room),
    });
  }

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
  }

  async createCategory(name: string, sortOrder: number = 0): Promise<Category> {
    return this.request<Category>('/api/category/create', {
      method: 'POST',
      body: JSON.stringify({ name, sort_order: sortOrder }),
    });
  }

  async updateCategory(id: string, name: string, sortOrder: number): Promise<Category> {
    return this.request<Category>('/api/category/update', {
      method: 'PUT',
      body: JSON.stringify({ id, name, sort_order: sortOrder }),
    });
  }

  async deleteCategory(id: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/category/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  async joinRoom(roomId: string, password?: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/room/join', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, password }),
    });
  }

  async leaveRoom(roomId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/room/leave', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId }),
    });
  }

  async getICEConfig(): Promise<ICEConfig> {
    return this.request<ICEConfig>('/api/voice/ice');
  }

  async createInvite(roomId: string, maxUses: number = 0, expiresIn: number = 0): Promise<Invite> {
    return this.request<Invite>('/api/invite/create', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, max_uses: maxUses, expires_in: expiresIn }),
    });
  }

  async getInvites(roomId: string): Promise<Invite[]> {
    return this.request<Invite[]>(`/api/invites?room_id=${roomId}`);
  }

  async useInvite(code: string, password?: string): Promise<{ status: string; room_id: string; room_name: string }> {
    return this.request<{ status: string; room_id: string; room_name: string }>('/api/invite/use', {
      method: 'POST',
      body: JSON.stringify({ code, password }),
    });
  }

  async revokeInvite(inviteId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/invite/revoke', {
      method: 'POST',
      body: JSON.stringify({ invite_id: inviteId }),
    });
  }

  async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/api/roles');
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    return this.request<RoomMember[]>(`/api/role/members?room_id=${roomId}`);
  }

  async getUserRole(roomId: string): Promise<Role> {
    return this.request<Role>(`/api/role/user?room_id=${roomId}`);
  }

  async updateMemberRole(roomId: string, userId: string, role: string): Promise<{ status: string; role: string }> {
    return this.request<{ status: string; role: string }>('/api/role/update', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, user_id: userId, role }),
    });
  }

  async kickUser(roomId: string, userId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/role/kick', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, user_id: userId }),
    });
  }
}

export const roomApi = new RoomApi();
