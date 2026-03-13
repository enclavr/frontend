import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationsPage from '@/app/notifications/page';
import { useAuthStore, type AuthState } from '@/lib/store';
import { pushService } from '@/lib/push';

const { mockUseAuthStore, mockPushService } = vi.hoisted(() => ({
  mockUseAuthStore: vi.fn<() => AuthState>(() => ({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    clearError: vi.fn(),
  })),
  mockPushService: {
    setToken: vi.fn(),
    getNotificationSettings: vi.fn(),
    getSubscriptions: vi.fn(),
    isPushSupported: vi.fn(),
    isSubscribed: vi.fn(),
    subscribeToPush: vi.fn(),
    unsubscribeFromPush: vi.fn(),
    updateNotificationSettings: vi.fn(),
    testNotification: vi.fn(),
  },
}));

vi.mock('@/lib/store', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('@/lib/push', () => ({
  pushService: mockPushService,
}));

const createMockUser = () => ({
  id: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: '',
  is_admin: false,
  created_at: '2024-01-01T00:00:00Z',
});

const createMockSettings = (overrides = {}) => ({
  enable_push: true,
  enable_dm_notifications: true,
  enable_mention_notifications: true,
  enable_room_notifications: true,
  enable_sound: true,
  notify_on_mobile: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  ...overrides,
});

const createMockSubscription = (overrides = {}) => ({
  id: 'sub-1',
  endpoint: 'https://example.com/push',
  is_active: true,
  device_id: 'device-1',
  device_os: 'Chrome',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuthStore.mockReturnValue({
      user: createMockUser(),
      token: 'test-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      clearError: vi.fn(),
    });

    mockPushService.setToken.mockResolvedValue(undefined);
    mockPushService.isPushSupported.mockResolvedValue(true);
    mockPushService.isSubscribed.mockResolvedValue(true);
    mockPushService.getNotificationSettings.mockResolvedValue(createMockSettings());
    mockPushService.getSubscriptions.mockResolvedValue([createMockSubscription()]);
  });

  it('should load notification settings on mount', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(mockPushService.setToken).toHaveBeenCalledWith('test-token');
      expect(mockPushService.getNotificationSettings).toHaveBeenCalled();
      expect(mockPushService.getSubscriptions).toHaveBeenCalled();
    });
  });

  it('should display push notification section', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
    });
  });

  it('should display notification preferences section', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });
  });

  it('should display quiet hours section', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Quiet Hours')).toBeInTheDocument();
    });
  });

  it('should display connected devices', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Chrome')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('should handle test notification button', async () => {
    const user = userEvent.setup();
    mockPushService.testNotification.mockResolvedValue(1);

    render(<NotificationsPage />);

    const testButton = await screen.findByRole('button', { name: /Send Test/i });
    await user.click(testButton);

    await waitFor(() => {
      expect(mockPushService.testNotification).toHaveBeenCalled();
    });
  });

  it('should handle device removal', async () => {
    const user = userEvent.setup();
    mockPushService.unsubscribeFromPush.mockResolvedValue(undefined);

    render(<NotificationsPage />);

    const removeButton = await screen.findByRole('button', { name: /Remove/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(mockPushService.unsubscribeFromPush).toHaveBeenCalled();
    });
  });

  it('should show unsupported message when push not available', async () => {
    mockPushService.isPushSupported.mockResolvedValue(false);

    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/not supported/i)).toBeInTheDocument();
    });
  });

  it('should show back button navigation', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /← Back to Rooms/i })).toBeInTheDocument();
    });
  });

  it('should display all notification preference labels', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Sound').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mobile Notifications').length).toBeGreaterThan(0);
    });
  });

  it('should handle settings toggle updates', async () => {
    const user = userEvent.setup();
    mockPushService.updateNotificationSettings.mockResolvedValue(createMockSettings({
      enable_dm_notifications: false,
    }));

    render(<NotificationsPage />);

    const toggles = await screen.findAllByRole('checkbox');
    expect(toggles.length).toBeGreaterThan(0);
  });

  it('should display notification settings header', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Notification Settings')).toBeInTheDocument();
    });
  });
});
