const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export interface PushSubscription {
  id: string;
  endpoint: string;
  is_active: boolean;
  device_id: string;
  device_os: string;
  created_at: string;
}

export interface NotificationSettings {
  enable_push: boolean;
  enable_dm_notifications: boolean;
  enable_mention_notifications: boolean;
  enable_room_notifications: boolean;
  enable_sound: boolean;
  notify_on_mobile: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

class PushService {
  private token: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
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

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

     try {
       this.registration = await navigator.serviceWorker.register('/sw.js');
       return this.registration;
     } catch (error) {
       console.error('Service Worker registration failed:', error);
       return null;
     }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      this.registration = await this.registerServiceWorker();
    }

    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const pushSubscription = {
        endpoint: subscription.endpoint,
        p256dh: this.getKeys(subscription).p256dh,
        auth: this.getKeys(subscription).auth,
      };

      const result = await this.request<PushSubscription>('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(pushSubscription),
      });

      return result;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  async unsubscribeFromPush(subscriptionId: string): Promise<void> {
    try {
      const subscription = await this.registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      await this.request<{ message: string }>(`/api/push/unsubscribe/${subscriptionId}`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
    }
  }

  async getSubscriptions(): Promise<PushSubscription[]> {
    try {
      return await this.request<PushSubscription[]>('/api/push/subscriptions', {
        method: 'GET',
      });
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      return [];
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      return await this.request<NotificationSettings>('/api/push/settings', {
        method: 'GET',
      });
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return null;
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    try {
      return await this.request<NotificationSettings>('/api/push/settings/update', {
        method: 'POST',
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      return null;
    }
  }

  async testNotification(): Promise<number> {
    try {
      const result = await this.request<{ sent: number }>('/api/push/test', {
        method: 'POST',
      });
      return result.sent;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return 0;
    }
  }

  async isPushSupported(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }
    try {
      await navigator.serviceWorker.ready;
      return true;
    } catch {
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }

  private getKeys(subscription: PushSubscriptionObject): { p256dh: string; auth: string } {
    if ('keys' in subscription && subscription.keys) {
      return {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      };
    }
    return { p256dh: '', auth: '' };
  }

  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    if (!base64String) {
      return new ArrayBuffer(0);
    }
    
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer;
  }
}

interface PushSubscriptionObject {
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

export const pushService = new PushService();
