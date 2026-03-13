import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '@/app/settings/page';
import { useAuthStore } from '@/lib/store';

vi.mock('@/lib/store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-1', username: 'test', email: 'test@test.com', display_name: 'Test', avatar_url: '', is_admin: false },
    token: 'token',
    refreshToken: 'refresh',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    clearError: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.stubGlobal('navigator', {
  mediaDevices: {
    enumerateDevices: vi.fn().mockResolvedValue([
      { deviceId: 'mic-1', kind: 'audioinput', label: 'Mic 1' },
      { deviceId: 'speaker-1', kind: 'audiooutput', label: 'Speaker 1' },
    ]),
    getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
  },
});

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 'user-1', username: 'test', email: 'test@test.com', display_name: 'Test', avatar_url: '', is_admin: false },
      token: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it('renders settings page title', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders audio tab by default', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Audio Settings')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('has appearance tab button', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByText('Appearance'));
    expect(screen.getByText('Appearance Settings')).toBeInTheDocument();
  });

  it('has privacy tab button', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByText('Privacy'));
    expect(screen.getByText('Privacy Settings')).toBeInTheDocument();
  });
});
