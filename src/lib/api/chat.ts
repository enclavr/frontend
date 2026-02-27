import { BaseApiClient } from './base';
import type { Message, MessageType, SearchResult } from '@/types';

export class ChatApi extends BaseApiClient {
  async sendMessage(roomId: string, content: string, type: MessageType = 'text'): Promise<Message> {
    return this.request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, content, type }),
    });
  }

  async getMessages(roomId: string, limit: number = 50): Promise<Message[]> {
    return this.request<Message[]>(`/api/messages?room_id=${roomId}&limit=${limit}`);
  }

  async updateMessage(messageId: string, content: string): Promise<Message> {
    return this.request<Message>(`/api/message/update?message_id=${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/message/delete?message_id=${messageId}`, {
      method: 'DELETE',
    });
  }

  async searchMessages(query: string, limit: number = 50): Promise<SearchResult[]> {
    return this.request<SearchResult[]>(`/api/messages/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }
}

export const chatApi = new ChatApi();
