import { BaseApiClient } from './base';
import type { Conversation, DirectMessage } from '@/types';

export class DMApi extends BaseApiClient {
  async sendDM(receiverId: string, content: string): Promise<DirectMessage> {
    return this.request<DirectMessage>('/api/dm/send', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });
  }

  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/dm/conversations');
  }

  async getDMMessages(userId: string): Promise<DirectMessage[]> {
    return this.request<DirectMessage[]>(`/api/dm/messages?user_id=${userId}`);
  }

  async updateDM(messageId: string, content: string): Promise<DirectMessage> {
    return this.request<DirectMessage>('/api/dm/update', {
      method: 'PUT',
      body: JSON.stringify({ message_id: messageId, content }),
    });
  }

  async deleteDM(messageId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/dm/delete', {
      method: 'DELETE',
      body: JSON.stringify({ message_id: messageId }),
    });
  }
}

export const dmApi = new DMApi();
