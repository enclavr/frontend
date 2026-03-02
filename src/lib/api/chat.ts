import { BaseApiClient } from './base';
import type { Message, MessageType, SearchResult, ReactionWithCount } from '@/types';

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

  async getPinnedMessages(roomId: string): Promise<Message[]> {
    return this.request<Message[]>(`/api/pinnedmessages?room_id=${roomId}`);
  }

  async pinMessage(messageId: string, roomId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/pinnedmessages', {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId, room_id: roomId }),
    });
  }

  async unpinMessage(messageId: string, roomId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/pinnedmessages?message_id=${messageId}&room_id=${roomId}`, {
      method: 'DELETE',
    });
  }

  async addReaction(messageId: string, emoji: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/reactions', {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId, emoji }),
    });
  }

  async removeReaction(messageId: string, emoji: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/reactions', {
      method: 'DELETE',
      body: JSON.stringify({ message_id: messageId, emoji }),
    });
  }

  async getReactions(messageId: string): Promise<ReactionWithCount[]> {
    return this.request<ReactionWithCount[]>(`/api/reactions?message_id=${messageId}`);
  }
}

export const chatApi = new ChatApi();
