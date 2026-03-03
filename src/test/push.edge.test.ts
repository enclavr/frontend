import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pushService } from '@/lib/push';

describe('Push Service', () => {
  let originalWindow: typeof globalThis.window;
  let originalNavigator: typeof navigator;

  beforeEach(() => {
    vi.clearAllMocks();
    
    originalWindow = global.window;
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  describe('isPushSupported', () => {
    it('should return false in SSR context (no window)', async () => {
      vi.stubGlobal('window', undefined);
      vi.stubGlobal('navigator', {});
      
      const result = await pushService.isPushSupported();
      
      expect(result).toBe(false);
    });

    it('should return false when serviceWorker not supported', async () => {
      vi.stubGlobal('window', { location: {} });
      vi.stubGlobal('navigator', { serviceWorker: undefined });
      
      const result = await pushService.isPushSupported();
      
      expect(result).toBe(false);
    });

    it('should return false when serviceWorker ready fails', async () => {
      vi.stubGlobal('window', { location: {} });
      vi.stubGlobal('navigator', { 
        serviceWorker: {
          ready: Promise.reject(new Error('Not available')),
        } 
      });
      
      const result = await pushService.isPushSupported();
      
      expect(result).toBe(false);
    });

    it('should return true when serviceWorker is ready', async () => {
      vi.stubGlobal('window', { location: {} });
      vi.stubGlobal('navigator', { 
        serviceWorker: {
          ready: Promise.resolve({} as ServiceWorkerRegistration),
        } 
      });
      
      const result = await pushService.isPushSupported();
      
      expect(result).toBe(true);
    });
  });

  describe('isSubscribed', () => {
    it('should return false when no registration', async () => {
      const result = await pushService.isSubscribed();
      
      expect(result).toBe(false);
    });

    it('should return false when no subscription exists', async () => {
      vi.stubGlobal('window', { location: {} });
      vi.stubGlobal('navigator', {});
      
      const mockRegistration = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(null),
        },
      };
      
      (pushService as unknown as { registration: ServiceWorkerRegistration | null }).registration = mockRegistration as unknown as ServiceWorkerRegistration;
      
      const result = await pushService.isSubscribed();
      
      expect(result).toBe(false);
    });

    it('should return true when subscription exists', async () => {
      vi.stubGlobal('window', { location: {} });
      vi.stubGlobal('navigator', {});
      
      const mockRegistration = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue({ endpoint: 'test' }),
        },
      };
      
      (pushService as unknown as { registration: ServiceWorkerRegistration | null }).registration = mockRegistration as unknown as ServiceWorkerRegistration;
      
      const result = await pushService.isSubscribed();
      
      expect(result).toBe(true);
    });
  });

  describe('getSubscriptions', () => {
    it('should return empty array on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.getSubscriptions();
      
      expect(result).toEqual([]);
    });

    it('should return empty array when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
        ok: false, 
        status: 500,
        json: () => Promise.resolve({ message: 'Error' }),
      }));
      
      const result = await pushService.getSubscriptions();
      
      expect(result).toEqual([]);
    });
  });

  describe('getNotificationSettings', () => {
    it('should return null on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.getNotificationSettings();
      
      expect(result).toBeNull();
    });

    it('should return null when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
        ok: false, 
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      }));
      
      const result = await pushService.getNotificationSettings();
      
      expect(result).toBeNull();
    });
  });

  describe('updateNotificationSettings', () => {
    it('should return null on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.updateNotificationSettings({ enable_push: true });
      
      expect(result).toBeNull();
    });

    it('should return null when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
        ok: false, 
        status: 400,
        json: () => Promise.resolve({ message: 'Bad request' }),
      }));
      
      const result = await pushService.updateNotificationSettings({ enable_push: true });
      
      expect(result).toBeNull();
    });
  });

  describe('testNotification', () => {
    it('should return 0 on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      
      const result = await pushService.testNotification();
      
      expect(result).toBe(0);
    });

    it('should return 0 when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ 
        ok: false, 
        status: 500,
        json: () => Promise.resolve({ message: 'Error' }),
      }));
      
      const result = await pushService.testNotification();
      
      expect(result).toBe(0);
    });
  });

  describe('setToken', () => {
    it('should set token', () => {
      pushService.setToken('test-token');
      expect((pushService as unknown as { token: string | null }).token).toBe('test-token');
    });

    it('should allow setting null token', () => {
      pushService.setToken('test-token');
      pushService.setToken(null);
      expect((pushService as unknown as { token: string | null }).token).toBeNull();
    });
  });
});
