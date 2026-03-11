import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserProfileModal } from '@/components/UserProfileModal';
import type { UserProfile } from '@/types';

const mockProfile: UserProfile = {
  user: {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    display_name: 'Test User',
    avatar_url: '',
    is_admin: false,
  },
  joined_at: '2024-01-15T10:00:00Z',
  roles: [{ name: 'Moderator', permissions: ['kick', 'ban'] }],
  rooms_count: 5,
  messages_count: 1234,
  last_seen: '2024-03-11T08:00:00Z',
  status: 'online',
};

describe('UserProfileModal', () => {
  it('renders user profile information correctly', () => {
    render(<UserProfileModal profile={mockProfile} onClose={() => {}} />);

    expect(screen.getByText('Test User')).toBeDefined();
    expect(screen.getByText('@testuser')).toBeDefined();
    expect(screen.getByText('Moderator')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('1234')).toBeDefined();
  });

  it('displays online status indicator', () => {
    render(<UserProfileModal profile={mockProfile} onClose={() => {}} />);
    
    const statusIndicator = document.querySelector('.bg-green-500');
    expect(statusIndicator).toBeDefined();
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<UserProfileModal profile={mockProfile} onClose={onClose} />);

    const closeButton = document.querySelector('button');
    closeButton?.click();
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onMessage when message button is clicked', () => {
    const onMessage = vi.fn();
    render(<UserProfileModal profile={mockProfile} onClose={() => {}} onMessage={onMessage} />);

    const messageButton = screen.getByText('Message');
    messageButton.click();
    
    expect(onMessage).toHaveBeenCalled();
  });

  it('renders admin badge when user is admin', () => {
    const adminProfile: UserProfile = {
      ...mockProfile,
      user: { ...mockProfile.user, is_admin: true },
    };
    
    render(<UserProfileModal profile={adminProfile} onClose={() => {}} />);
    
    expect(screen.getByText('Administrator')).toBeDefined();
  });

  it('renders kick and ban buttons when handlers provided', () => {
    const onKick = vi.fn();
    const onBan = vi.fn();
    
    render(
      <UserProfileModal 
        profile={mockProfile} 
        onClose={() => {}} 
        onKick={onKick}
        onBan={onBan}
      />
    );

    expect(screen.getByText('Kick')).toBeDefined();
    expect(screen.getByText('Ban')).toBeDefined();
  });

  it('does not render when profile is null', () => {
    const { container } = render(<UserProfileModal profile={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
