import { BaseApiClient } from './base';
import { UserProfile } from '@/types';

export class UserApi extends BaseApiClient {
  async getUserProfile(userId: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/users/${userId}/profile`, {
      method: 'GET',
    });
  }

  async getUserById(userId: string): Promise<{ id: string; username: string; display_name: string; avatar_url: string; is_admin: boolean }> {
    return this.request(`/api/users/${userId}`, {
      method: 'GET',
    });
  }
}

export const userApi = new UserApi();
