import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchModal } from '@/components/SearchModal';

describe('SearchModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search modal when open', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
  });

  it('should show hint text when query is empty', () => {
    render(<SearchModal {...defaultProps} />);
    expect(screen.getByText('Type at least 2 characters to search')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<SearchModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Search Messages')).not.toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<SearchModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<SearchModal {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    buttons[0].click();
    expect(onClose).toHaveBeenCalled();
  });

  it('should handle onSelectMessage callback', () => {
    const onSelectMessage = vi.fn();
    render(<SearchModal {...defaultProps} onSelectMessage={onSelectMessage} />);
    expect(onSelectMessage).not.toHaveBeenCalled();
  });
});
