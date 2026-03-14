import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcuts, useKeyboardShortcuts } from '@/components/KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when closed', () => {
    const { container } = render(<KeyboardShortcuts isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when open', () => {
    const { container } = render(<KeyboardShortcuts isOpen={true} onClose={() => {}} />);
    expect(container.firstChild).not.toBeNull();
  });

  it('should display keyboard shortcuts', () => {
    render(<KeyboardShortcuts isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Show keyboard shortcuts')).toBeDefined();
    expect(screen.getByText('Focus search')).toBeDefined();
  });

  it('should close on Escape key', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcuts isOpen={true} onClose={onClose} />);
    
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should filter shortcuts by search query', () => {
    render(<KeyboardShortcuts isOpen={true} onClose={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    fireEvent.change(searchInput, { target: { value: 'mute' } });
    
    expect(screen.getByText('Mute/unmute microphone')).toBeDefined();
    expect(screen.queryByText('Focus search')).toBeNull();
  });

  it('should show "No shortcuts found" when no matches', () => {
    render(<KeyboardShortcuts isOpen={true} onClose={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText('Search shortcuts...');
    fireEvent.change(searchInput, { target: { value: 'xyz123nonexistent' } });
    
    expect(screen.getByText('No shortcuts found')).toBeDefined();
  });

  it('should display keyboard shortcut categories', () => {
    render(<KeyboardShortcuts isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('General')).toBeDefined();
    expect(screen.getByText('Voice')).toBeDefined();
  });

  it('should have close button', () => {
    const onClose = vi.fn();
    const { getByLabelText } = render(<KeyboardShortcuts isOpen={true} onClose={onClose} />);
    
    const closeButton = getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });
});

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return showShortcuts state', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(result.current.showShortcuts).toBe(false);
  });

  it('should return setShowShortcuts function', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    expect(typeof result.current.setShowShortcuts).toBe('function');
  });

  it('should set showShortcuts to true when ? is pressed', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    
    act(() => {
      fireEvent.keyDown(document, { key: '?' });
    });
    
    expect(result.current.showShortcuts).toBe(true);
  });

  it('should not trigger ? shortcut when in input', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    
    act(() => {
      fireEvent.keyDown(input, { key: '?' });
    });
    
    expect(result.current.showShortcuts).toBe(false);
    
    document.body.removeChild(input);
  });

  it('should not trigger ? shortcut when Ctrl is pressed', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());
    
    act(() => {
      fireEvent.keyDown(document, { key: '?', ctrlKey: true });
    });
    
    expect(result.current.showShortcuts).toBe(false);
  });
});
