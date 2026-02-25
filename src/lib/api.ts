const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async register(username: string, email: string, password: string) {
    return this.request<import('@/types').AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(username: string, password: string) {
    return this.request<import('@/types').AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<import('@/types').AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async getMe() {
    return this.request<import('@/types').User>('/api/auth/me');
  }

  async getRooms() {
    return this.request<import('@/types').Room[]>('/api/rooms');
  }

  async getRoom(id: string) {
    return this.request<import('@/types').Room>(`/api/room?id=${id}`);
  }

  async createRoom(room: import('@/types').RoomCreate) {
    return this.request<import('@/types').Room>('/api/room/create', {
      method: 'POST',
      body: JSON.stringify(room),
    });
  }

  async getCategories() {
    return this.request<import('@/types').Category[]>('/api/categories');
  }

  async createCategory(name: string, sortOrder: number = 0) {
    return this.request<import('@/types').Category>('/api/category/create', {
      method: 'POST',
      body: JSON.stringify({ name, sort_order: sortOrder }),
    });
  }

  async updateCategory(id: string, name: string, sortOrder: number) {
    return this.request<import('@/types').Category>('/api/category/update', {
      method: 'PUT',
      body: JSON.stringify({ id, name, sort_order: sortOrder }),
    });
  }

  async deleteCategory(id: string) {
    return this.request<{ status: string }>('/api/category/delete', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }

  async joinRoom(roomId: string, password?: string) {
    return this.request<{ status: string }>('/api/room/join', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, password }),
    });
  }

  async leaveRoom(roomId: string) {
    return this.request<{ status: string }>('/api/room/leave', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId }),
    });
  }

  async getICEConfig() {
    return this.request<import('@/types').ICEConfig>('/api/voice/ice');
  }

  async sendMessage(roomId: string, content: string, type: string = 'text') {
    return this.request<import('@/types').Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, content, type }),
    });
  }

  async getMessages(roomId: string, limit: number = 50) {
    return this.request<import('@/types').Message[]>(`/api/messages?room_id=${roomId}&limit=${limit}`);
  }

  async updateMessage(messageId: string, content: string) {
    return this.request<import('@/types').Message>(`/api/message/update?message_id=${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string) {
    return this.request<{ status: string }>(`/api/message/delete?message_id=${messageId}`, {
      method: 'DELETE',
    });
  }

  async updatePresence(status: string, roomId?: string) {
    return this.request<import('@/types').Presence>('/api/presence', {
      method: 'POST',
      body: JSON.stringify({ status, room_id: roomId }),
    });
  }

  async getRoomPresence(roomId: string) {
    return this.request<import('@/types').Presence[]>(`/api/presence?room_id=${roomId}`);
  }

  async sendDM(receiverId: string, content: string) {
    return this.request<import('@/types').DirectMessage>('/api/dm/send', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });
  }

  async getConversations() {
    return this.request<import('@/types').Conversation[]>('/api/dm/conversations');
  }

  async getDMMessages(userId: string) {
    return this.request<import('@/types').DirectMessage[]>(`/api/dm/messages?user_id=${userId}`);
  }

  async updateDM(messageId: string, content: string) {
    return this.request<import('@/types').DirectMessage>('/api/dm/update', {
      method: 'PUT',
      body: JSON.stringify({ message_id: messageId, content }),
    });
  }

  async deleteDM(messageId: string) {
    return this.request<{ status: string }>('/api/dm/delete', {
      method: 'DELETE',
      body: JSON.stringify({ message_id: messageId }),
    });
  }

  async createInvite(roomId: string, maxUses: number = 0, expiresIn: number = 0) {
    return this.request<import('@/types').Invite>('/api/invite/create', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, max_uses: maxUses, expires_in: expiresIn }),
    });
  }

  async getInvites(roomId: string) {
    return this.request<import('@/types').Invite[]>(`/api/invites?room_id=${roomId}`);
  }

  async useInvite(code: string, password?: string) {
    return this.request<{ status: string; room_id: string; room_name: string }>('/api/invite/use', {
      method: 'POST',
      body: JSON.stringify({ code, password }),
    });
  }

  async revokeInvite(inviteId: string) {
    return this.request<{ status: string }>('/api/invite/revoke', {
      method: 'POST',
      body: JSON.stringify({ invite_id: inviteId }),
    });
  }

  async getRoles() {
    return this.request<import('@/types').Role[]>('/api/roles');
  }

  async getRoomMembers(roomId: string) {
    return this.request<import('@/types').RoomMember[]>(`/api/role/members?room_id=${roomId}`);
  }

  async getUserRole(roomId: string) {
    return this.request<import('@/types').Role>(`/api/role/user?room_id=${roomId}`);
  }

  async updateMemberRole(roomId: string, userId: string, role: string) {
    return this.request<{ status: string; role: string }>('/api/role/update', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, user_id: userId, role }),
    });
  }

  async kickUser(roomId: string, userId: string) {
    return this.request<{ status: string }>('/api/role/kick', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, user_id: userId }),
    });
  }

  async createWebhook(roomId: string, url: string, events: string[]) {
    return this.request<import('@/types').Webhook>(`/api/webhook/create/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ url, events }),
    });
  }

  async getWebhooks(roomId: string) {
    return this.request<import('@/types').Webhook[]>(`/api/webhook/room/${roomId}`);
  }

  async deleteWebhook(webhookId: string) {
    return this.request<{ message: string }>(`/api/webhook/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async toggleWebhook(webhookId: string) {
    return this.request<{ is_active: boolean }>(`/api/webhook/toggle/${webhookId}`, {
      method: 'POST',
    });
  }

  async getWebhookLogs(webhookId: string, limit: number = 50) {
    return this.request<import('@/types').WebhookLog[]>(`/api/webhook/logs/${webhookId}?limit=${limit}`);
  }

  async searchMessages(query: string, limit: number = 50) {
    return this.request<import('@/types').SearchResult[]>(`/api/messages/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async uploadFile(roomId: string, file: File): Promise<{
    id: string;
    file_name: string;
    file_size: number;
    content_type: string;
    url: string;
  }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);

    const response = await fetch(`${API_URL}/api/files`, {
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

  async getRoomFiles(roomId: string): Promise<import('@/types').UploadedFile[]> {
    return this.request<import('@/types').UploadedFile[]>(`/api/files?room_id=${roomId}`);
  }

  async deleteFile(fileId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/files/delete?file_id=${fileId}`, {
      method: 'DELETE',
    });
  }

  async getEmojis(): Promise<import('@/types').ServerEmoji[]> {
    return this.request<import('@/types').ServerEmoji[]>('/api/emoji');
  }

  async createEmoji(name: string, imageUrl: string): Promise<import('@/types').ServerEmoji> {
    return this.request<import('@/types').ServerEmoji>('/api/emoji/create', {
      method: 'POST',
      body: JSON.stringify({ name, image_url: imageUrl }),
    });
  }

  async deleteEmoji(emojiId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/emoji/delete?emoji_id=${emojiId}`, {
      method: 'DELETE',
    });
  }

  async getStickers(): Promise<import('@/types').ServerSticker[]> {
    return this.request<import('@/types').ServerSticker[]>('/api/sticker');
  }

  async createSticker(name: string, imageUrl: string): Promise<import('@/types').ServerSticker> {
    return this.request<import('@/types').ServerSticker>('/api/sticker/create', {
      method: 'POST',
      body: JSON.stringify({ name, image_url: imageUrl }),
    });
  }

  async deleteSticker(stickerId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/sticker/delete?sticker_id=${stickerId}`, {
      method: 'DELETE',
    });
  }

  async getSounds(): Promise<import('@/types').SoundboardSound[]> {
    return this.request<import('@/types').SoundboardSound[]>('/api/soundboard');
  }

  async createSound(name: string, audioUrl: string, hotkey?: string, volume?: number): Promise<import('@/types').SoundboardSound> {
    return this.request<import('@/types').SoundboardSound>('/api/soundboard/create', {
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

  async getAnalyticsOverview(days: number = 30): Promise<import('@/types').AnalyticsOverview> {
    return this.request<import('@/types').AnalyticsOverview>(`/api/analytics/overview?days=${days}`);
  }

  async getDailyActivity(days: number = 30): Promise<import('@/types').DailyActivity[]> {
    return this.request<import('@/types').DailyActivity[]>(`/api/analytics/daily?days=${days}`);
  }

  async getChannelStats(days: number = 30): Promise<import('@/types').ChannelStats[]> {
    return this.request<import('@/types').ChannelStats[]>(`/api/analytics/channels?days=${days}`);
  }

  async getHourlyActivity(days: number = 30): Promise<import('@/types').HourlyStats[]> {
    return this.request<import('@/types').HourlyStats[]>(`/api/analytics/hourly?days=${days}`);
  }

  async getTopUsers(days: number = 30, limit: number = 10): Promise<import('@/types').TopUser[]> {
    return this.request<import('@/types').TopUser[]>(`/api/analytics/users?days=${days}&limit=${limit}`);
  }
}

export const api = new ApiClient();
