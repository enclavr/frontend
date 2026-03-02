import { BaseApiClient } from './api/base';
import { AuthApi } from './api/auth';
import { RoomApi } from './api/room';
import { ChatApi } from './api/chat';
import { DMApi } from './api/dm';
import { PresenceApi } from './api/presence';
import { AdminApi } from './api/admin';
import type {
  AuthResponse,
  User,
  Room,
  RoomCreate,
  Category,
  ICEConfig,
  Message,
  MessageType,
  Presence,
  Conversation,
  DirectMessage,
  Invite,
  Role,
  RoomMember,
  Webhook,
  WebhookLog,
  SearchResult,
  UploadedFile,
  ServerEmoji,
  ServerSticker,
  SoundboardSound,
  AnalyticsOverview,
  DailyActivity,
  ChannelStats,
  HourlyStats,
  TopUser,
  Ban,
  CreateBanRequest,
  Report,
  CreateReportRequest,
  ReportStatus,
  ReactionWithCount,
} from '@/types';

class ApiClient extends BaseApiClient {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

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

  async updatePresence(status: Presence['status'], roomId?: string): Promise<Presence> {
    return this.request<Presence>('/api/presence', {
      method: 'POST',
      body: JSON.stringify({ status, room_id: roomId }),
    });
  }

  async getRoomPresence(roomId: string): Promise<Presence[]> {
    return this.request<Presence[]>(`/api/presence?room_id=${roomId}`);
  }

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

  async createWebhook(roomId: string, url: string, events: string[]): Promise<Webhook> {
    return this.request<Webhook>(`/api/webhook/create/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    });
  }

  async getWebhooks(roomId: string): Promise<Webhook[]> {
    return this.request<Webhook[]>(`/api/webhook/room/${roomId}`);
  }

  async deleteWebhook(webhookId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/webhook/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async toggleWebhook(webhookId: string): Promise<{ is_active: boolean }> {
    return this.request<{ is_active: boolean }>(`/api/webhook/toggle/${webhookId}`, {
      method: 'POST',
    });
  }

  async getWebhookLogs(webhookId: string, limit: number = 50): Promise<WebhookLog[]> {
    return this.request<WebhookLog[]>(`/api/webhook/logs/${webhookId}?limit=${limit}`);
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

  async uploadFile(roomId: string, file: File): Promise<UploadedFile> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/files`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getRoomFiles(roomId: string): Promise<UploadedFile[]> {
    return this.request<UploadedFile[]>(`/api/files?room_id=${roomId}`);
  }

  async deleteFile(fileId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/files/delete?file_id=${fileId}`, {
      method: 'DELETE',
    });
  }

  async getEmojis(): Promise<ServerEmoji[]> {
    return this.request<ServerEmoji[]>('/api/emoji');
  }

  async createEmoji(name: string, imageUrl: string): Promise<ServerEmoji> {
    return this.request<ServerEmoji>('/api/emoji/create', {
      method: 'POST',
      body: JSON.stringify({ name, image_url: imageUrl }),
    });
  }

  async deleteEmoji(emojiId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/emoji/delete?emoji_id=${emojiId}`, {
      method: 'DELETE',
    });
  }

  async getStickers(): Promise<ServerSticker[]> {
    return this.request<ServerSticker[]>('/api/sticker');
  }

  async createSticker(name: string, imageUrl: string): Promise<ServerSticker> {
    return this.request<ServerSticker>('/api/sticker/create', {
      method: 'POST',
      body: JSON.stringify({ name, image_url: imageUrl }),
    });
  }

  async deleteSticker(stickerId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/sticker/delete?sticker_id=${stickerId}`, {
      method: 'DELETE',
    });
  }

  async getSounds(): Promise<SoundboardSound[]> {
    return this.request<SoundboardSound[]>('/api/soundboard');
  }

  async createSound(name: string, audioUrl: string, hotkey?: string, volume?: number): Promise<SoundboardSound> {
    return this.request<SoundboardSound>('/api/soundboard/create', {
      method: 'POST',
      body: JSON.stringify({ name, audio_url: audioUrl, hotkey, volume }),
    });
  }

  async playSound(soundId: string, roomId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>('/api/soundboard/play', {
      method: 'POST',
      body: JSON.stringify({ sound_id: soundId, room_id: roomId }),
    });
  }

  async deleteSound(soundId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/soundboard/delete?sound_id=${soundId}`, {
      method: 'DELETE',
    });
  }

  async getAnalyticsOverview(days: number = 30): Promise<AnalyticsOverview> {
    return this.request<AnalyticsOverview>(`/api/analytics/overview?days=${days}`);
  }

  async getDailyActivity(days: number = 30): Promise<DailyActivity[]> {
    return this.request<DailyActivity[]>(`/api/analytics/daily?days=${days}`);
  }

  async getChannelStats(days: number = 30): Promise<ChannelStats[]> {
    return this.request<ChannelStats[]>(`/api/analytics/channels?days=${days}`);
  }

  async getHourlyActivity(days: number = 30): Promise<HourlyStats[]> {
    return this.request<HourlyStats[]>(`/api/analytics/hourly?days=${days}`);
  }

  async getTopUsers(days: number = 30, limit: number = 10): Promise<TopUser[]> {
    return this.request<TopUser[]>(`/api/analytics/users?days=${days}&limit=${limit}`);
  }

  async createBan(ban: CreateBanRequest): Promise<{ message: string; ban: Ban }> {
    return this.request<{ message: string; ban: Ban }>('/api/ban', {
      method: 'POST',
      body: JSON.stringify(ban),
    });
  }

  async getBans(roomId: string): Promise<{ bans: Ban[] }> {
    return this.request<{ bans: Ban[] }>(`/api/ban/room?room_id=${roomId}`);
  }

  async getBan(banId: string): Promise<{ ban: Ban }> {
    return this.request<{ ban: Ban }>(`/api/ban/?id=${banId}`);
  }

  async updateBan(banId: string, reason?: string, expiresAt?: string): Promise<{ message: string; ban: Ban }> {
    return this.request<{ message: string; ban: Ban }>('/api/ban/update?id=' + banId, {
      method: 'PUT',
      body: JSON.stringify({ reason, expires_at: expiresAt }),
    });
  }

  async deleteBan(banId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/ban/delete?id=${banId}`, {
      method: 'DELETE',
    });
  }

  async checkUserBan(userId: string, roomId: string): Promise<{ banned: boolean; ban?: Ban }> {
    return this.request<{ banned: boolean; ban?: Ban }>(`/api/ban/check?user_id=${userId}&room_id=${roomId}`);
  }

  async createReport(report: CreateReportRequest): Promise<{ message: string; report: Report }> {
    return this.request<{ message: string; report: Report }>('/api/report', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  async getReports(status?: ReportStatus): Promise<{ reports: Report[] }> {
    const query = status ? `?status=${status}` : '';
    return this.request<{ reports: Report[] }>(`/api/reports${query}`);
  }

  async getReport(reportId: string): Promise<{ report: Report }> {
    return this.request<{ report: Report }>(`/api/report/?id=${reportId}`);
  }

  async reviewReport(reportId: string, status: ReportStatus, reviewNotes?: string): Promise<{ message: string; report: Report }> {
    return this.request<{ message: string; report: Report }>(`/api/report/review?id=${reportId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, review_notes: reviewNotes }),
    });
  }

  async deleteReport(reportId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/report/delete?id=${reportId}`, {
      method: 'DELETE',
    });
  }

  async getMyReports(): Promise<{ reports: Report[] }> {
    return this.request<{ reports: Report[] }>('/api/reports/my');
  }
}

export const api = new ApiClient();
export { BaseApiClient } from './api/base';
export { AuthApi, authApi } from './api/auth';
export { RoomApi, roomApi } from './api/room';
export { ChatApi, chatApi } from './api/chat';
export { DMApi, dmApi } from './api/dm';
export { PresenceApi, presenceApi } from './api/presence';
export { AdminApi, adminApi } from './api/admin';
