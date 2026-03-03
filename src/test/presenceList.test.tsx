import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PresenceList } from '@/components/PresenceList';
import type { Presence } from '@/types';

vi.mock('@/hooks/usePresence', () => ({
  usePresence: vi.fn(),
}));

import { usePresence } from '@/hooks/usePresence';

describe('PresenceList Component', () => {
  const mockUsePresence = usePresence as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPresences: Presence[] = [
    {
      user_id: 'user-1',
      username: 'testuser1',
      status: 'online',
      room_id: 'room-1',
      last_seen: '2026-02-26T10:00:00Z',
    },
    {
      user_id: 'user-2',
      username: 'testuser2',
      status: 'away',
      room_id: 'room-1',
      last_seen: '2026-02-26T09:00:00Z',
    },
  ];

  it('should render presence list', () => {
    mockUsePresence.mockReturnValue({
      presences: mockPresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    expect(screen.getByText('Online Users (2)')).toBeInTheDocument();
  });

  it('should display user names', () => {
    mockUsePresence.mockReturnValue({
      presences: mockPresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    expect(screen.getByText('testuser1')).toBeInTheDocument();
    expect(screen.getByText('testuser2')).toBeInTheDocument();
  });

  it('should show "(you)" for current user', () => {
    mockUsePresence.mockReturnValue({
      presences: mockPresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });

  it('should not show "(you)" for other users', () => {
    mockUsePresence.mockReturnValue({
      presences: mockPresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    const user2Element = screen.getByText('testuser2');
    expect(user2Element.innerHTML).not.toContain('(you)');
  });

  it('should show online status text', () => {
    mockUsePresence.mockReturnValue({
      presences: [mockPresences[0]],
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-2" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('should show away status text', () => {
    mockUsePresence.mockReturnValue({
      presences: [mockPresences[1]],
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    expect(screen.getByText('Away')).toBeInTheDocument();
  });

  it('should show busy status text', () => {
    const busyPresences: Presence[] = [
      { user_id: 'user-1', username: 'testuser', status: 'busy', room_id: 'room-1', last_seen: '2026-02-26T10:00:00Z' },
    ];
    mockUsePresence.mockReturnValue({
      presences: busyPresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-2" />);
    expect(screen.getByText('Busy')).toBeInTheDocument();
  });

  it('should show offline status text', () => {
    const offlinePresences: Presence[] = [
      { user_id: 'user-1', username: 'testuser', status: 'offline', room_id: 'room-1', last_seen: '2026-02-26T10:00:00Z' },
    ];
    mockUsePresence.mockReturnValue({
      presences: offlinePresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-2" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUsePresence.mockReturnValue({
      presences: [],
      isLoading: true,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show no users message when presences is empty', () => {
    mockUsePresence.mockReturnValue({
      presences: [],
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    expect(screen.getByText('No users online')).toBeInTheDocument();
  });

  it('should show avatar initial', () => {
    mockUsePresence.mockReturnValue({
      presences: [mockPresences[0]],
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-2" />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should pass roomId to usePresence hook', () => {
    mockUsePresence.mockReturnValue({
      presences: [],
      isLoading: false,
    });

    render(<PresenceList roomId="test-room" userId="user-1" />);
    expect(usePresence).toHaveBeenCalledWith({
      roomId: 'test-room',
      userId: 'user-1',
      isConnected: undefined,
    });
  });

  it('should pass isVoiceConnected to usePresence hook when provided', () => {
    mockUsePresence.mockReturnValue({
      presences: [],
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" isVoiceConnected={true} />);
    expect(usePresence).toHaveBeenCalledWith({
      roomId: 'room-1',
      userId: 'user-1',
      isConnected: true,
    });
  });

  it('should pass isVoiceConnected as false when provided', () => {
    mockUsePresence.mockReturnValue({
      presences: [],
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" isVoiceConnected={false} />);
    expect(usePresence).toHaveBeenCalledWith({
      roomId: 'room-1',
      userId: 'user-1',
      isConnected: false,
    });
  });

  it('should handle multiple users with different statuses', () => {
    const mixedPresences: Presence[] = [
      { user_id: 'user-1', username: 'user1', status: 'online', room_id: 'room-1', last_seen: '2026-02-26T10:00:00Z' },
      { user_id: 'user-2', username: 'user2', status: 'away', room_id: 'room-1', last_seen: '2026-02-26T09:00:00Z' },
      { user_id: 'user-3', username: 'user3', status: 'busy', room_id: 'room-1', last_seen: '2026-02-26T08:00:00Z' },
      { user_id: 'user-4', username: 'user4', status: 'offline', room_id: 'room-1', last_seen: '2026-02-26T07:00:00Z' },
    ];
    mockUsePresence.mockReturnValue({
      presences: mixedPresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-1" />);
    expect(screen.getByText('Online Users (4)')).toBeInTheDocument();
  });

  it('should handle unicode usernames', () => {
    const unicodePresences: Presence[] = [
      { user_id: 'user-1', username: '用户1', status: 'online', room_id: 'room-1', last_seen: '2026-02-26T10:00:00Z' },
    ];
    mockUsePresence.mockReturnValue({
      presences: unicodePresences,
      isLoading: false,
    });

    render(<PresenceList roomId="room-1" userId="user-2" />);
    expect(screen.getByText('用户1')).toBeInTheDocument();
  });
});
