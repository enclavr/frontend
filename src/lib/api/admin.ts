import { BaseApiClient } from './base';
import type {
  Webhook,
  WebhookLog,
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
  UploadedFile,
} from '@/types';

export class AdminApi extends BaseApiClient {
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
}

export const adminApi = new AdminApi();
