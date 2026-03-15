import { BaseApiClient } from './base';
import type { Message, MessageType, SearchResult, ReactionWithCount, ThreadReply, BlockedUser } from '@/types';

export class ChatApi extends BaseApiClient {
  async sendMessage(roomId: string, content: string, type: MessageType = 'text', parentId?: string): Promise<Message> {
    return this.request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, content, type, parent_id: parentId }),
    });
  }

  async getMessages(roomId: string, limit: number = 50): Promise<Message[]> {
    return this.request<Message[]>(`/api/messages?room_id=${roomId}&limit=${limit}`);
  }

  async getThreadMessages(parentId: string): Promise<ThreadReply[]> {
    return this.request<ThreadReply[]>(`/api/threads?parent_id=${parentId}`);
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

  async markMessageAsRead(messageId: string, roomId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/messages/read', {
      method: 'POST',
      body: JSON.stringify({ message_id: messageId, room_id: roomId }),
    });
  }

  async getReadReceipts(messageId: string): Promise<{ userId: string; readAt: string }[]> {
    return this.request<{ userId: string; readAt: string }[]>(`/api/messages/read?message_id=${messageId}`);
  }

  async blockUser(blockedUserId: string, reason?: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/users/block', {
      method: 'POST',
      body: JSON.stringify({ blocked_user_id: blockedUserId, reason: reason || '' }),
    });
  }

  async unblockUser(blockedUserId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/users/block?blocked_user_id=${blockedUserId}`, {
      method: 'DELETE',
    });
  }

  async getBlockedUsers(): Promise<BlockedUser[]> {
    return this.request<BlockedUser[]>('/api/users/blocked');
  }
}

export const chatApi = new ChatApi();
