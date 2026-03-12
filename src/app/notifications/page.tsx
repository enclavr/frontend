'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { pushService, NotificationSettings, PushSubscription } from '@/lib/push';

interface NotificationState {
  settings: NotificationSettings | null;
  subscriptions: PushSubscription[];
  isLoading: boolean;
  isSubscribed: boolean;
  pushSupported: boolean;
  testResult: number | null;
  error: string | null;
}

export default function NotificationsPage() {
  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();
  
  const [state, setState] = useState<NotificationState>({
    settings: null,
    subscriptions: [],
    isLoading: true,
    isSubscribed: false,
    pushSupported: false,
    testResult: null,
    error: null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      pushService.setToken(token);
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      const [settings, subscriptions, pushSupported, isSubscribed] = await Promise.all([
        pushService.getNotificationSettings(),
        pushService.getSubscriptions(),
        pushService.isPushSupported(),
        pushService.isSubscribed(),
      ]);

      setState(prev => ({
        ...prev,
        settings,
        subscriptions,
        pushSupported,
        isSubscribed,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load notification settings',
      }));
    }
  };

  const handleTogglePush = async () => {
    if (state.isSubscribed) {
      const sub = state.subscriptions[0];
      if (sub) {
        await pushService.unsubscribeFromPush(sub.id);
      }
    } else {
      const result = await pushService.subscribeToPush();
      if (result) {
        await loadData();
        return;
      }
    }
    await loadData();
  };

  const handleUpdateSettings = async (updates: Partial<NotificationSettings>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const updated = await pushService.updateNotificationSettings(updates);
      if (updated) {
        setState(prev => ({ ...prev, settings: updated, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to update settings' }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to update settings',
      }));
    }
  };

  const handleTestNotification = async () => {
    setState(prev => ({ ...prev, testResult: null }));
    const result = await pushService.testNotification();
    setState(prev => ({ ...prev, testResult: result }));
  };

  const handleUnsubscribeDevice = async (deviceId: string) => {
    const sub = state.subscriptions.find(s => s.device_id === deviceId);
    if (sub) {
      await pushService.unsubscribeFromPush(sub.id);
      await loadData();
    }
  };

  if (!user) return null;

  const settings = state.settings;

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">Enclavr</div>
        
        <div className="sidebar-content">
          <div className="sidebar-nav-item" onClick={() => router.push('/rooms')}>Rooms</div>
          <div className="sidebar-nav-item" onClick={() => router.push('/dm')}>Direct Messages</div>
          <div className="sidebar-nav-item" onClick={() => router.push('/account')}>Account</div>
          <div className="sidebar-nav-item active">Notifications</div>
        </div>

        <div className="sidebar-footer">
          <div 
            className="user-account"
            onClick={() => router.push('/account')}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4a90d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</div>
              <div style={{ fontSize: 11, color: '#888' }}>View Account</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="main-header">Notification Settings</div>
        
        <div className="main-body">
          <button className="back-button" onClick={() => router.push('/rooms')}>
            ← Back to Rooms
          </button>

          {state.isLoading && <div className="loading">Loading...</div>}

          {state.error && (
            <div className="error-message" style={{ marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 6, color: '#dc2626' }}>
              {state.error}
            </div>
          )}

          {state.pushSupported && (
            <div className="settings-section">
              <h3 className="settings-title">Push Notifications</h3>
              
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Enable Push Notifications</div>
                  <div className="setting-description">
                    Receive notifications even when the app is closed
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={state.isSubscribed}
                    onChange={handleTogglePush}
                    disabled={state.isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {state.isSubscribed && (
                <>
                  <div className="setting-row">
                    <div className="setting-info">
                      <div className="setting-label">Test Notification</div>
                      <div className="setting-description">
                        Send a test notification to all your devices
                      </div>
                    </div>
                    <button 
                      className="btn-secondary"
                      onClick={handleTestNotification}
                      disabled={state.isLoading}
                    >
                      Send Test
                    </button>
                  </div>

                  {state.testResult !== null && (
                    <div style={{ marginTop: 8, padding: 12, background: state.testResult > 0 ? '#dcfce7' : '#fee2e2', borderRadius: 6, color: state.testResult > 0 ? '#16a34a' : '#dc2626' }}>
                      {state.testResult > 0 
                        ? `Test notification sent successfully to ${state.testResult} device(s)!`
                        : 'Failed to send test notification'}
                    </div>
                  )}

                  {state.subscriptions.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div className="setting-label" style={{ marginBottom: 8 }}>Connected Devices</div>
                      {state.subscriptions.map(sub => (
                        <div key={sub.id} className="device-item">
                          <div className="device-info">
                            <div className="device-name">
                              {sub.device_os || 'Unknown Device'}
                              {sub.is_active && <span className="device-active-badge">Active</span>}
                            </div>
                            <div className="device-meta">
                              {new Date(sub.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <button 
                            className="btn-danger-small"
                            onClick={() => handleUnsubscribeDevice(sub.device_id)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!state.pushSupported && (
            <div className="settings-section">
              <div style={{ padding: 16, background: '#fef3c7', borderRadius: 6, color: '#92400e' }}>
                Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.
              </div>
            </div>
          )}

          {settings && (
            <div className="settings-section">
              <h3 className="settings-title">Notification Preferences</h3>
              
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Direct Messages</div>
                  <div className="setting-description">
                    Get notified when you receive direct messages
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.enable_dm_notifications}
                    onChange={(e) => handleUpdateSettings({ enable_dm_notifications: e.target.checked })}
                    disabled={state.isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Mentions</div>
                  <div className="setting-description">
                    Get notified when someone mentions you
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.enable_mention_notifications}
                    onChange={(e) => handleUpdateSettings({ enable_mention_notifications: e.target.checked })}
                    disabled={state.isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Room Activity</div>
                  <div className="setting-description">
                    Get notified about activity in your rooms
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.enable_room_notifications}
                    onChange={(e) => handleUpdateSettings({ enable_room_notifications: e.target.checked })}
                    disabled={state.isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Sound</div>
                  <div className="setting-description">
                    Play a sound for notifications
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.enable_sound}
                    onChange={(e) => handleUpdateSettings({ enable_sound: e.target.checked })}
                    disabled={state.isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Mobile Notifications</div>
                  <div className="setting-description">
                    Send notifications to mobile devices
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.notify_on_mobile}
                    onChange={(e) => handleUpdateSettings({ notify_on_mobile: e.target.checked })}
                    disabled={state.isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {settings && (
            <div className="settings-section">
              <h3 className="settings-title">Quiet Hours</h3>
              
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Enable Quiet Hours</div>
                  <div className="setting-description">
                    Pause notifications during specific hours
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.quiet_hours_enabled}
                    onChange={(e) => handleUpdateSettings({ quiet_hours_enabled: e.target.checked })}
                    disabled={state.isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {settings.quiet_hours_enabled && (
                <div className="quiet-hours-inputs">
                  <div className="time-input-group">
                    <label className="time-label">Start Time</label>
                    <input
                      type="time"
                      value={settings.quiet_hours_start || '22:00'}
                      onChange={(e) => handleUpdateSettings({ quiet_hours_start: e.target.value })}
                      className="time-input"
                    />
                  </div>
                  <div className="time-input-group">
                    <label className="time-label">End Time</label>
                    <input
                      type="time"
                      value={settings.quiet_hours_end || '08:00'}
                      onChange={(e) => handleUpdateSettings({ quiet_hours_end: e.target.value })}
                      className="time-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
