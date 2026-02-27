import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pushService, PushSubscription, NotificationSettings } from '@/lib/push';

describe('PushService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('setToken', () => {
    it('should set token', () => {
      pushService.setToken('test-token');
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should clear token when null is passed', () => {
      pushService.setToken('test-token');
      pushService.setToken(null);
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('registerServiceWorker', () => {
    it('should return null when window is undefined', async () => {
      const result = await pushService.registerServiceWorker();
      expect(result).toBeNull();
    });
  });

  describe('isPushSupported', () => {
    it('should return false when window is undefined', async () => {
      const result = await pushService.isPushSupported();
      expect(result).toBe(false);
    });
  });

  describe('isSubscribed', () => {
    it('should return false when no registration', async () => {
      const result = await pushService.isSubscribed();
      expect(result).toBe(false);
    });
  });

  describe('getSubscriptions', () => {
    it('should return empty array on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.getSubscriptions();
      
      expect(result).toEqual([]);
      vi.unstubAllGlobals();
    });

    it('should return subscriptions on success', async () => {
      const mockSubscriptions: PushSubscription[] = [
        { id: '1', endpoint: 'endpoint1', is_active: true, device_id: 'device1', device_os: 'ios', created_at: '2026-01-01' }
      ];
      
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSubscriptions)
      }));
      
      const result = await pushService.getSubscriptions();
      
      expect(result).toEqual(mockSubscriptions);
      vi.unstubAllGlobals();
    });
  });

  describe('getNotificationSettings', () => {
    it('should return null on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.getNotificationSettings();
      
      expect(result).toBeNull();
      vi.unstubAllGlobals();
    });

    it('should return settings on success', async () => {
      const mockSettings: NotificationSettings = {
        enable_push: true,
        enable_dm_notifications: true,
        enable_mention_notifications: true,
        enable_room_notifications: true,
        enable_sound: true,
        notify_on_mobile: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '',
        quiet_hours_end: ''
      };
      
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSettings)
      }));
      
      const result = await pushService.getNotificationSettings();
      
      expect(result).toEqual(mockSettings);
      vi.unstubAllGlobals();
    });
  });

  describe('updateNotificationSettings', () => {
    it('should return null on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.updateNotificationSettings({ enable_push: false });
      
      expect(result).toBeNull();
      vi.unstubAllGlobals();
    });

    it('should return updated settings on success', async () => {
      const mockSettings: NotificationSettings = {
        enable_push: false,
        enable_dm_notifications: true,
        enable_mention_notifications: true,
        enable_room_notifications: true,
        enable_sound: true,
        notify_on_mobile: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '',
        quiet_hours_end: ''
      };
      
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSettings)
      }));
      
      const result = await pushService.updateNotificationSettings({ enable_push: false });
      
      expect(result).toEqual(mockSettings);
      vi.unstubAllGlobals();
    });
  });

  describe('testNotification', () => {
    it('should return 0 on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.testNotification();
      
      expect(result).toBe(0);
      vi.unstubAllGlobals();
    });

    it('should return sent count on success', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ sent: 5 })
      }));
      
      const result = await pushService.testNotification();
      
      expect(result).toBe(5);
      vi.unstubAllGlobals();
    });
  });
});

describe('PushService Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle empty VAPID key', async () => {
    const result = await pushService.isPushSupported();
    expect(result).toBe(false);
  });

  it('should handle fetch with non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'Server error' })
    }));
    
    const result = await pushService.getSubscriptions();
    
    expect(result).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('should handle invalid JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    }));
    
    const result = await pushService.getSubscriptions();
    
    expect(result).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('should handle partial notification settings update', async () => {
    const mockSettings: NotificationSettings = {
      enable_push: true,
      enable_dm_notifications: false,
      enable_mention_notifications: false,
      enable_room_notifications: false,
      enable_sound: false,
      notify_on_mobile: false,
      quiet_hours_enabled: false,
      quiet_hours_start: '',
      quiet_hours_end: ''
    };
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockSettings)
    }));
    
    const result = await pushService.updateNotificationSettings({ enable_sound: true });
    
    expect(result).toBeDefined();
    vi.unstubAllGlobals();
  });

  it('should handle HTTP 401 unauthorized response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ message: 'Unauthorized' })
    }));
    
    const result = await pushService.getNotificationSettings();
    
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });

  it('should handle HTTP 403 forbidden response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ message: 'Forbidden' })
    }));
    
    const result = await pushService.updateNotificationSettings({ enable_push: false });
    
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });

  it('should handle HTTP 404 not found response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ message: 'Not found' })
    }));
    
    const result = await pushService.testNotification();
    
    expect(result).toBe(0);
    vi.unstubAllGlobals();
  });

  it('should handle network timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Request timeout')));
    
    const result = await pushService.getSubscriptions();
    
    expect(result).toEqual([]);
    vi.unstubAllGlobals();
  });

  it('should handle empty response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(null)
    }));
    
    const result = await pushService.getNotificationSettings();
    
    expect(result).toBeNull();
    vi.unstubAllGlobals();
  });

  it('should handle CORS error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    
    const result = await pushService.testNotification();
    
    expect(result).toBe(0);
    vi.unstubAllGlobals();
  });

  it('should handle quiet hours settings update', async () => {
    const mockSettings: NotificationSettings = {
      enable_push: true,
      enable_dm_notifications: true,
      enable_mention_notifications: true,
      enable_room_notifications: true,
      enable_sound: true,
      notify_on_mobile: false,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    };
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockSettings)
    }));
    
    const result = await pushService.updateNotificationSettings({ 
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    });
    
    expect(result?.quiet_hours_enabled).toBe(true);
    expect(result?.quiet_hours_start).toBe('22:00');
    expect(result?.quiet_hours_end).toBe('08:00');
    vi.unstubAllGlobals();
  });

  it('should handle mobile notification settings', async () => {
    const mockSettings: NotificationSettings = {
      enable_push: true,
      enable_dm_notifications: true,
      enable_mention_notifications: true,
      enable_room_notifications: true,
      enable_sound: true,
      notify_on_mobile: true,
      quiet_hours_enabled: false,
      quiet_hours_start: '',
      quiet_hours_end: ''
    };
    
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockSettings)
    }));
    
    const result = await pushService.updateNotificationSettings({ notify_on_mobile: true });
    
    expect(result?.notify_on_mobile).toBe(true);
    vi.unstubAllGlobals();
  });
});
