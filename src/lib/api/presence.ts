import { BaseApiClient } from './base';
import type { Presence } from '@/types';

export class PresenceApi extends BaseApiClient {
  async updatePresence(status: Presence['status'], roomId?: string): Promise<Presence> {
    return this.request<Presence>('/api/presence', {
      method: 'POST',
      body: JSON.stringify({ status, room_id: roomId }),
    });
  }

  async getRoomPresence(roomId: string): Promise<Presence[]> {
    return this.request<Presence[]>(`/api/presence?room_id=${roomId}`);
  }
}

export const presenceApi = new PresenceApi();
