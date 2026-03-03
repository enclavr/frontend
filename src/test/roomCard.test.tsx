import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoomCard } from '@/components/RoomCard';
import type { Room } from '@/types';

describe('RoomCard Component', () => {
  const createMockRoom = (overrides: Partial<Room> = {}): Room => ({
    id: 'room-1',
    name: 'Test Room',
    description: 'A test room description',
    is_private: false,
    max_users: 50,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    user_count: 10,
    ...overrides,
  });

  const defaultProps = {
    room: createMockRoom(),
    currentRoomId: undefined,
    onJoin: () => {},
    onSelectRoom: () => {},
  };

  it('should render room name', () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText('Test Room')).toBeInTheDocument();
  });

  it('should render room description when provided', () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText('A test room description')).toBeInTheDocument();
  });

  it('should not render description when empty', () => {
    const room = createMockRoom({ description: '' });
    render(<RoomCard {...defaultProps} room={room} />);
    expect(screen.queryByText(/description/)).not.toBeInTheDocument();
  });

  it('should render user count', () => {
    render(<RoomCard {...defaultProps} />);
    expect(screen.getByText('10/50 users')).toBeInTheDocument();
  });

  it('should show private badge for private rooms', () => {
    const room = createMockRoom({ is_private: true });
    render(<RoomCard {...defaultProps} room={room} />);
    expect(screen.getByText(/Private/)).toBeInTheDocument();
  });

  it('should not show private badge for public rooms', () => {
    const room = createMockRoom({ is_private: false });
    render(<RoomCard {...defaultProps} room={room} />);
    expect(screen.queryByText(/Private/)).not.toBeInTheDocument();
  });

  it('should render join button when not in current room', () => {
    render(<RoomCard {...defaultProps} currentRoomId="other-room" />);
    expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
  });

  it('should not render join button when already in room', () => {
    render(<RoomCard {...defaultProps} currentRoomId="room-1" />);
    expect(screen.queryByRole('button', { name: /join/i })).not.toBeInTheDocument();
  });

  it('should call onSelectRoom when join button clicked', () => {
    const onSelectRoom = vi.fn();
    render(<RoomCard {...defaultProps} onSelectRoom={onSelectRoom} currentRoomId="other-room" />);
    
    screen.getByRole('button', { name: /join/i }).click();
    
    expect(onSelectRoom).toHaveBeenCalledWith('room-1');
  });

  it('should display zero users correctly', () => {
    const room = createMockRoom({ user_count: 0, max_users: 50 });
    render(<RoomCard {...defaultProps} room={room} />);
    expect(screen.getByText('0/50 users')).toBeInTheDocument();
  });

  it('should display full room correctly', () => {
    const room = createMockRoom({ user_count: 50, max_users: 50 });
    render(<RoomCard {...defaultProps} room={room} />);
    expect(screen.getByText('50/50 users')).toBeInTheDocument();
  });

  it('should handle room with long name', () => {
    const room = createMockRoom({ name: 'A'.repeat(100) });
    render(<RoomCard {...defaultProps} room={room} />);
    expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
  });

  it('should handle room with long description', () => {
    const room = createMockRoom({ description: 'B'.repeat(500) });
    render(<RoomCard {...defaultProps} room={room} />);
    expect(screen.getByText('B'.repeat(500))).toBeInTheDocument();
  });
});
