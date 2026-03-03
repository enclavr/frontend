import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchModal } from '@/components/SearchModal';
import type { SearchResult } from '@/types';

describe('SearchModal Component', () => {
  const defaultProps = {
    searchResults: [] as SearchResult[],
    isSearching: false,
    onClose: vi.fn(),
    onSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search modal', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByText('Search Messages')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });

  it('should update query on input change', () => {
    render(<SearchModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(input).toHaveValue('test query');
  });

  it('should call onSearch when form submitted', () => {
    const onSearch = vi.fn();
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: 'test query' } });
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(onSearch).toHaveBeenCalledWith('test query');
  });

  it('should not call onSearch with empty query', () => {
    const onSearch = vi.fn();
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('should not call onSearch with whitespace-only query', () => {
    const onSearch = vi.fn();
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: '   ' } });
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('should call onSearch with trimmed query', () => {
    const onSearch = vi.fn();
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: '  test query  ' } });
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(onSearch).toHaveBeenCalledWith('  test query  ');
  });

  it('should show searching indicator when isSearching is true', () => {
    render(<SearchModal {...defaultProps} isSearching={true} />);
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('should not show searching indicator when isSearching is false', () => {
    render(<SearchModal {...defaultProps} isSearching={false} />);
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
  });

  it('should display search results', () => {
    const results: SearchResult[] = [
      {
        id: '1',
        user_id: 'user-1',
        username: 'testuser',
        content: 'Hello world',
        room_name: 'general',
        created_at: '2026-02-26T10:00:00Z',
      },
    ];
    render(<SearchModal {...defaultProps} searchResults={results} />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('#general')).toBeInTheDocument();
  });

  it('should display multiple search results', () => {
    const results: SearchResult[] = [
      { id: '1', user_id: 'user-1', username: 'user1', content: 'message 1', created_at: '2026-02-26T10:00:00Z' },
      { id: '2', user_id: 'user-2', username: 'user2', content: 'message 2', created_at: '2026-02-26T11:00:00Z' },
      { id: '3', user_id: 'user-3', username: 'user3', content: 'message 3', created_at: '2026-02-26T12:00:00Z' },
    ];
    render(<SearchModal {...defaultProps} searchResults={results} />);
    expect(screen.getAllByText(/message/).length).toBe(3);
  });

  it('should not show no results message when no results and not searching', () => {
    render(<SearchModal {...defaultProps} searchResults={[]} isSearching={false} />);
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('should not show no results message when searching', () => {
    render(<SearchModal {...defaultProps} isSearching={true} />);
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('should not show no results message when no query', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<SearchModal {...defaultProps} onClose={onClose} />);
    screen.getByRole('button', { name: /close/i }).click();
    expect(onClose).toHaveBeenCalled();
  });

  it('should display room name with # prefix', () => {
    const results: SearchResult[] = [
      { id: '1', room_id: 'room-1', room_name: 'general', content: 'test', created_at: '2026-02-26T10:00:00Z' },
    ];
    render(<SearchModal {...defaultProps} searchResults={results} />);
    expect(screen.getByText('#general')).toBeInTheDocument();
  });

  it('should handle result without room name', () => {
    const results: SearchResult[] = [
      { id: '1', content: 'test', created_at: '2026-02-26T10:00:00Z' },
    ];
    render(<SearchModal {...defaultProps} searchResults={results} />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should handle result without username', () => {
    const results: SearchResult[] = [
      { id: '1', content: 'test', created_at: '2026-02-26T10:00:00Z' },
    ];
    render(<SearchModal {...defaultProps} searchResults={results} />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('should handle special characters in search query', () => {
    const onSearch = vi.fn();
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: '<script>alert("xss")</script>' } });
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(onSearch).toHaveBeenCalledWith('<script>alert("xss")</script>');
  });

  it('should handle unicode characters in search query', () => {
    const onSearch = vi.fn();
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: 'Hello 世界 🌍' } });
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(onSearch).toHaveBeenCalledWith('Hello 世界 🌍');
  });

  it('should handle very long search query', () => {
    const onSearch = vi.fn();
    const longQuery = 'a'.repeat(1000);
    render(<SearchModal {...defaultProps} onSearch={onSearch} />);
    const input = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(input, { target: { value: longQuery } });
    const form = document.querySelector('form');
    form?.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(onSearch).toHaveBeenCalledWith(longQuery);
  });

  it('should handle empty search results array', () => {
    render(<SearchModal {...defaultProps} searchResults={[]} />);
    expect(screen.queryByText(/testuser/)).not.toBeInTheDocument();
  });
});
