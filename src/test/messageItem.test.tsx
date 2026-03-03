import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '@/components/MessageItem';
import type { Message, ReactionWithCount } from '@/types';

describe('MessageItem Component', () => {
  const defaultMessage: Message = {
    id: 'msg-1',
    room_id: 'room-1',
    user_id: 'user-1',
    username: 'testuser',
    type: 'text',
    content: 'Hello world',
    is_edited: false,
    is_deleted: false,
    created_at: '2026-02-26T10:00:00Z',
  };

  const defaultProps = {
    message: defaultMessage,
    isOwn: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onPin: vi.fn(),
    onAddReaction: vi.fn(),
    onRemoveReaction: vi.fn(),
    showReactionPicker: false,
    setShowReactionPicker: vi.fn(),
    reactions: [] as ReactionWithCount[],
    formatTime: (date: string) => '10:00:00',
    formatEditTime: (date?: string) => date ? '10:05:00' : '',
  };

  it('should render message content', () => {
    render(<MessageItem {...defaultProps} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should show username for other users messages', () => {
    render(<MessageItem {...defaultProps} isOwn={false} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should not show username for own messages', () => {
    render(<MessageItem {...defaultProps} isOwn={true} />);
    expect(screen.queryByText('testuser')).not.toBeInTheDocument();
  });

  it('should show avatar initial for other users', () => {
    render(<MessageItem {...defaultProps} isOwn={false} />);
    const avatar = screen.getByText('T');
    expect(avatar).toBeInTheDocument();
  });

  it('should display timestamp', () => {
    render(<MessageItem {...defaultProps} />);
    expect(screen.getByText(/10:00:00/)).toBeInTheDocument();
  });

  it('should show edited indicator when message is edited', () => {
    const editedMessage = { ...defaultMessage, is_edited: true, updated_at: '2026-02-26T10:05:00Z' };
    const formatEditTime = (date?: string) => date ? '10:05:00' : '';
    render(<MessageItem {...defaultProps} message={editedMessage} formatEditTime={formatEditTime} />);
    expect(screen.getByText(/\(10:05:00\)/)).toBeInTheDocument();
  });

  it('should show edit and delete buttons for own messages', () => {
    render(<MessageItem {...defaultProps} isOwn={true} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should not show edit/delete for other users messages', () => {
    render(<MessageItem {...defaultProps} isOwn={false} message={{ ...defaultMessage, is_deleted: false }} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should show pin button for own messages', () => {
    render(<MessageItem {...defaultProps} isOwn={true} />);
    expect(screen.getByTitle('Pin message')).toBeInTheDocument();
  });

  it('should show reaction button', () => {
    render(<MessageItem {...defaultProps} />);
    expect(screen.getByTitle('Add reaction')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<MessageItem {...defaultProps} isOwn={true} onEdit={onEdit} />);
    screen.getByRole('button', { name: /edit/i }).click();
    expect(onEdit).toHaveBeenCalled();
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<MessageItem {...defaultProps} isOwn={true} onDelete={onDelete} />);
    screen.getByRole('button', { name: /delete/i }).click();
    expect(onDelete).toHaveBeenCalled();
  });

  it('should call onPin when pin button clicked', () => {
    const onPin = vi.fn();
    render(<MessageItem {...defaultProps} isOwn={true} onPin={onPin} />);
    screen.getByTitle('Pin message').click();
    expect(onPin).toHaveBeenCalled();
  });

  it('should show reaction picker when showReactionPicker is true', () => {
    render(<MessageItem {...defaultProps} showReactionPicker={true} />);
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  it('should call onAddReaction when emoji clicked', () => {
    const onAddReaction = vi.fn();
    render(<MessageItem {...defaultProps} showReactionPicker={true} onAddReaction={onAddReaction} />);
    screen.getByText('👍').click();
    expect(onAddReaction).toHaveBeenCalledWith('👍');
  });

  it('should display deleted message text', () => {
    const deletedMessage = { ...defaultMessage, is_deleted: true };
    render(<MessageItem {...defaultProps} message={deletedMessage} />);
    expect(screen.getByText('Message deleted')).toBeInTheDocument();
  });

  it('should show deleted message with reduced opacity', () => {
    const deletedMessage = { ...defaultMessage, is_deleted: true };
    const { container } = render(<MessageItem {...defaultProps} message={deletedMessage} />);
    const messageDiv = container.querySelector('.opacity-50');
    expect(messageDiv).toBeInTheDocument();
  });

  it('should not show edit/delete for deleted messages', () => {
    const deletedMessage = { ...defaultMessage, is_deleted: true };
    render(<MessageItem {...defaultProps} isOwn={true} message={deletedMessage} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('should render system message with different style', () => {
    const systemMessage = { ...defaultMessage, type: 'system' as const, content: 'User joined' };
    const { container } = render(<MessageItem {...defaultProps} message={systemMessage} />);
    const messageDiv = container.querySelector('.bg-yellow-600\\/50');
    expect(messageDiv).toBeInTheDocument();
  });

  it('should display reactions', () => {
    const reactions: ReactionWithCount[] = [
      { emoji: '👍', count: 2, users: ['user1', 'user2'], has_reacted: false },
      { emoji: '❤️', count: 1, users: ['user1'], has_reacted: true },
    ];
    render(<MessageItem {...defaultProps} reactions={reactions} />);
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should call onRemoveReaction when clicking own reaction', () => {
    const onRemoveReaction = vi.fn();
    const reactions: ReactionWithCount[] = [
      { emoji: '👍', count: 1, users: ['user1'], has_reacted: true },
    ];
    render(<MessageItem {...defaultProps} reactions={reactions} onRemoveReaction={onRemoveReaction} />);
    screen.getByText('👍').click();
    expect(onRemoveReaction).toHaveBeenCalledWith('👍');
  });

  it('should call onAddReaction when clicking unreacted emoji', () => {
    const onAddReaction = vi.fn();
    const reactions: ReactionWithCount[] = [
      { emoji: '👍', count: 1, users: ['user2'], has_reacted: false },
    ];
    render(<MessageItem {...defaultProps} reactions={reactions} onAddReaction={onAddReaction} />);
    screen.getByText('👍').click();
    expect(onAddReaction).toHaveBeenCalledWith('👍');
  });

  it('should show reacted style for own reactions', () => {
    const reactions: ReactionWithCount[] = [
      { emoji: '👍', count: 1, users: ['user1'], has_reacted: true },
    ];
    const { container } = render(<MessageItem {...defaultProps} reactions={reactions} />);
    const reactionButton = container.querySelector('.bg-blue-600');
    expect(reactionButton).toBeInTheDocument();
  });

  it('should handle message with markdown content', () => {
    const markdownMessage = { ...defaultMessage, content: '**bold** and *italic*' };
    render(<MessageItem {...defaultProps} message={markdownMessage} />);
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  it('should handle message with code content', () => {
    const codeMessage = { ...defaultMessage, content: '`const x = 1`' };
    render(<MessageItem {...defaultProps} message={codeMessage} />);
    expect(screen.getByText('const x = 1')).toBeInTheDocument();
  });

  it('should handle empty reactions array', () => {
    const { container } = render(<MessageItem {...defaultProps} reactions={[]} />);
    const reactionsDiv = container.querySelector('.flex.flex-wrap');
    expect(reactionsDiv).not.toBeInTheDocument();
  });

  it('should handle own message with different background', () => {
    const { container } = render(<MessageItem {...defaultProps} isOwn={true} />);
    const messageDiv = container.querySelector('.bg-blue-600');
    expect(messageDiv).toBeInTheDocument();
  });

  it('should call setShowReactionPicker when reaction button clicked', () => {
    const setShowReactionPicker = vi.fn();
    render(<MessageItem {...defaultProps} setShowReactionPicker={setShowReactionPicker} />);
    screen.getByTitle('Add reaction').click();
    expect(setShowReactionPicker).toHaveBeenCalledWith(true);
  });

  it('should handle long message content', () => {
    const longMessage = { ...defaultMessage, content: 'a'.repeat(1000) };
    render(<MessageItem {...defaultProps} message={longMessage} />);
    expect(screen.getByText('a'.repeat(1000))).toBeInTheDocument();
  });

  it('should handle special characters in message', () => {
    const specialMessage = { ...defaultMessage, content: '<script>alert("xss")</script>' };
    render(<MessageItem {...defaultProps} message={specialMessage} />);
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });

  it('should handle unicode characters in message', () => {
    const unicodeMessage = { ...defaultMessage, content: 'Hello 世界 🌍 🎉' };
    render(<MessageItem {...defaultProps} message={unicodeMessage} />);
    expect(screen.getByText('Hello 世界 🌍 🎉')).toBeInTheDocument();
  });
});
