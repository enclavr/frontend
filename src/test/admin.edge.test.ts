import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminApi } from '@/lib/api/admin';

describe('Admin API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.setToken('test-token');
  });

  describe('Webhooks', () => {
    it('should create webhook', async () => {
      const mockWebhook = {
        id: 'webhook-1',
        room_id: 'room-1',
        url: 'https://example.com/webhook',
        events: ['message.created'],
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWebhook),
      });

      const result = await adminApi.createWebhook('room-1', 'https://example.com/webhook', ['message.created']);

      expect(result).toEqual(mockWebhook);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/webhook/create/room-1',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com/webhook', events: ['message.created'] }),
        })
      );
    });

    it('should get webhooks for room', async () => {
      const mockWebhooks = [
        { id: 'webhook-1', room_id: 'room-1', url: 'https://example.com/1', events: [], is_active: true, created_at: '2024-01-01T00:00:00Z' },
        { id: 'webhook-2', room_id: 'room-1', url: 'https://example.com/2', events: [], is_active: false, created_at: '2024-01-01T00:00:00Z' },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockWebhooks),
      });

      const result = await adminApi.getWebhooks('room-1');

      expect(result).toHaveLength(2);
    });

    it('should delete webhook', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Deleted' }),
      });

      const result = await adminApi.deleteWebhook('webhook-1');

      expect(result.message).toBe('Deleted');
    });

    it('should toggle webhook', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ is_active: true }),
      });

      const result = await adminApi.toggleWebhook('webhook-1');

      expect(result.is_active).toBe(true);
    });

    it('should throw error on webhook creation failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid URL' }),
      });

      await expect(
        adminApi.createWebhook('room-1', 'invalid-url', ['message.created'])
      ).rejects.toThrow('Invalid URL');
    });
  });

  describe('Reports', () => {
    it('should get reports without status filter', async () => {
      const mockReports = {
        reports: [
          { id: 'report-1', status: 'pending', reason: 'spam', created_at: '2024-01-01T00:00:00Z' },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReports),
      });

      const result = await adminApi.getReports();

      expect(result.reports).toHaveLength(1);
    });

    it('should get reports with status filter', async () => {
      const mockReports = {
        reports: [
          { id: 'report-1', status: 'resolved', reason: 'spam', created_at: '2024-01-01T00:00:00Z' },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReports),
      });

      const result = await adminApi.getReports('resolved');

      expect(result.reports).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/reports?status=resolved',
        expect.any(Object)
      );
    });

    it('should review report', async () => {
      const mockReview = {
        message: 'Report reviewed',
        report: { id: 'report-1', status: 'resolved', reason: 'spam', created_at: '2024-01-01T00:00:00Z' },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReview),
      });

      const result = await adminApi.reviewReport('report-1', 'resolved', 'Action taken');

      expect(result.message).toBe('Report reviewed');
      expect(result.report.status).toBe('resolved');
    });

    it('should create report', async () => {
      const mockCreateReport = {
        message: 'Report created',
        report: { id: 'report-new', status: 'pending', reason: 'spam', created_at: '2024-01-01T00:00:00Z' },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCreateReport),
      });

      const result = await adminApi.createReport({
        reported_id: 'user-1',
        room_id: 'room-1',
        reason: 'spam',
        description: 'Spam content',
      });

      expect(result.message).toBe('Report created');
    });
  });

  describe('Bans', () => {
    it('should create ban', async () => {
      const mockBan = {
        message: 'User banned',
        ban: {
          id: 'ban-1',
          user_id: 'user-1',
          room_id: 'room-1',
          reason: 'Violation',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBan),
      });

      const result = await adminApi.createBan({
        user_id: 'user-1',
        room_id: 'room-1',
        reason: 'Violation',
      });

      expect(result.message).toBe('User banned');
    });

    it('should get bans for room', async () => {
      const mockBans = {
        bans: [
          { id: 'ban-1', user_id: 'user-1', room_id: 'room-1', reason: 'Violation', created_at: '2024-01-01T00:00:00Z' },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBans),
      });

      const result = await adminApi.getBans('room-1');

      expect(result.bans).toHaveLength(1);
    });

    it('should check user ban', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ banned: true, ban: { id: 'ban-1' } }),
      });

      const result = await adminApi.checkUserBan('user-1', 'room-1');

      expect(result.banned).toBe(true);
      expect(result.ban).toBeDefined();
    });

    it('should return not banned', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ banned: false }),
      });

      const result = await adminApi.checkUserBan('user-1', 'room-1');

      expect(result.banned).toBe(false);
    });

    it('should delete ban', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Ban removed' }),
      });

      const result = await adminApi.deleteBan('ban-1');

      expect(result.message).toBe('Ban removed');
    });
  });

  describe('Analytics', () => {
    it('should get analytics overview with default days', async () => {
      const mockOverview = {
        total_messages: 1000,
        total_users: 100,
        active_users: 50,
        new_users: 10,
        voice_minutes: 500,
        messages_per_day: 33.3,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOverview),
      });

      const result = await adminApi.getAnalyticsOverview();

      expect(result.total_messages).toBe(1000);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/analytics/overview?days=30',
        expect.any(Object)
      );
    });

    it('should get analytics with custom days', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ total_messages: 500 }),
      });

      await adminApi.getAnalyticsOverview(7);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/analytics/overview?days=7',
        expect.any(Object)
      );
    });

    it('should get top users', async () => {
      const mockTopUsers = [
        { user_id: 'user-1', username: 'Alice', message_count: 100 },
        { user_id: 'user-2', username: 'Bob', message_count: 50 },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTopUsers),
      });

      const result = await adminApi.getTopUsers(30, 10);

      expect(result).toHaveLength(2);
    });
  });
});
