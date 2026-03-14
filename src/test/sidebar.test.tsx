import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';
import type { User } from '@/types';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

const mockUser: User = {
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  avatar_url: '',
  is_admin: false,
};

describe('Sidebar', () => {
  it('renders sidebar with header', () => {
    render(<Sidebar user={mockUser} onLogout={() => {}} />);
    
    expect(screen.getByText('Enclavr')).toBeDefined();
  });

  it('renders navigation items', () => {
    render(<Sidebar user={mockUser} onLogout={() => {}} />);
    
    expect(screen.getByText('Rooms')).toBeDefined();
    expect(screen.getByText('Direct Messages')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders user account section with username', () => {
    render(<Sidebar user={mockUser} onLogout={() => {}} />);
    
    expect(screen.getByText('testuser')).toBeDefined();
    expect(screen.getByText('View Account')).toBeDefined();
  });

  it('renders logout button', () => {
    render(<Sidebar user={mockUser} onLogout={() => {}} />);
    
    expect(screen.getByText('Logout')).toBeDefined();
  });

  it('calls onLogout when logout button is clicked', () => {
    const onLogout = vi.fn();
    render(<Sidebar user={mockUser} onLogout={onLogout} />);
    
    const logoutButton = screen.getByText('Logout');
    logoutButton.click();
    
    expect(onLogout).toHaveBeenCalled();
  });

  it('displays user initial in avatar', () => {
    render(<Sidebar user={mockUser} onLogout={() => {}} />);
    
    expect(screen.getByText('T')).toBeDefined();
  });

  it('handles null user gracefully', () => {
    render(<Sidebar user={null} onLogout={() => {}} />);
    
    expect(screen.getByText('User')).toBeDefined();
    expect(screen.getByText('Logout')).toBeDefined();
  });

  it('navigates to account page when user account is clicked', () => {
    const mockPush = vi.fn();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    
    render(<Sidebar user={mockUser} onLogout={() => {}} />);
    
    const userAccount = screen.getByText('testuser').closest('div');
    if (userAccount) {
      userAccount.click();
    }
    
    expect(mockPush).toHaveBeenCalledWith('/account');
  });
});
