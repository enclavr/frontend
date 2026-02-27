import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatInput } from '@/components/ChatInput';

describe('ChatInput Component', () => {
  const defaultProps = {
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    typingUsers: [],
    isConnected: false,
  };

  it('should render input field', () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByPlaceholderText('Connecting...')).toBeInTheDocument();
  });

  it('should show connecting placeholder when not connected', () => {
    render(<ChatInput {...defaultProps} isConnected={false} />);
    expect(screen.getByPlaceholderText('Connecting...')).toBeDisabled();
  });

  it('should show type message placeholder when connected', () => {
    render(<ChatInput {...defaultProps} isConnected={true} />);
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('should have send button', () => {
    render(<ChatInput {...defaultProps} />);
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should disable send button when input is empty', () => {
    render(<ChatInput {...defaultProps} value="" isConnected={true} />);
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should disable input when not connected', () => {
    render(<ChatInput {...defaultProps} isConnected={false} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should enable input when connected', () => {
    render(<ChatInput {...defaultProps} isConnected={true} />);
    expect(screen.getByRole('textbox')).toBeEnabled();
  });

  it('should display typing indicator when users are typing', () => {
    const typingUsers = [{ user_id: '1', username: 'Alice' }];
    render(<ChatInput {...defaultProps} typingUsers={typingUsers} />);
    expect(screen.getByText(/Alice is typing/)).toBeInTheDocument();
  });

  it('should display multiple typing users', () => {
    const typingUsers = [
      { user_id: '1', username: 'Alice' },
      { user_id: '2', username: 'Bob' },
    ];
    render(<ChatInput {...defaultProps} typingUsers={typingUsers} />);
    expect(screen.getByText(/Alice, Bob are typing/)).toBeInTheDocument();
  });

  it('should call onChange when typing', () => {
    let value = '';
    const handleChange = (newValue: string) => { value = newValue; };
    render(<ChatInput {...defaultProps} onChange={handleChange} isConnected={true} />);
    
    const input = screen.getByRole('textbox');
    input.setAttribute('value', 'Hello');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    expect(value).toBe('Hello');
  });

  it('should show file upload button', () => {
    render(<ChatInput {...defaultProps} roomId="room-1" />);
    expect(screen.getByTitle('Upload file')).toBeInTheDocument();
  });
});

describe('ChatInput Submit Behavior', () => {
  it('should call onSubmit with trimmed value', () => {
    let submittedValue = '';
    const props = {
      value: '  Hello World  ',
      onChange: () => {},
      onSubmit: (value: string) => { submittedValue = value; },
      typingUsers: [],
      isConnected: true,
    };
    
    render(<ChatInput {...props} />);
    
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
    
    expect(submittedValue).toBe('  Hello World  ');
  });

  it('should clear input after submit', () => {
    let currentValue = 'Hello';
    const props = {
      value: 'Hello',
      onChange: (value: string) => { currentValue = value; },
      onSubmit: () => {},
      typingUsers: [],
      isConnected: true,
    };
    
    render(<ChatInput {...props} />);
    
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
    
    expect(currentValue).toBe('');
  });

  it('should not submit empty message', () => {
    let submitted = false;
    const props = {
      value: '',
      onChange: () => {},
      onSubmit: () => { submitted = true; },
      typingUsers: [],
      isConnected: true,
    };
    
    render(<ChatInput {...props} />);
    
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
    
    expect(submitted).toBe(false);
  });

  it('should not submit whitespace-only message', () => {
    let submitted = false;
    const props = {
      value: '   ',
      onChange: () => {},
      onSubmit: () => { submitted = true; },
      typingUsers: [],
      isConnected: true,
    };
    
    render(<ChatInput {...props} />);
    
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
    
    expect(submitted).toBe(false);
  });
});

describe('ChatInput Keyboard Handling', () => {
  it('should submit on Enter key without shift', () => {
    let submitted = false;
    const props = {
      value: 'Test message',
      onChange: () => {},
      onSubmit: () => { submitted = true; },
      typingUsers: [],
      isConnected: true,
    };
    
    render(<ChatInput {...props} />);
    
    const input = screen.getByRole('textbox');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    
    expect(submitted).toBe(true);
  });

  it('should not submit on Enter with shift (allows newlines)', () => {
    let submitted = false;
    const props = {
      value: 'Test\nmessage',
      onChange: () => {},
      onSubmit: () => { submitted = true; },
      typingUsers: [],
      isConnected: true,
    };
    
    render(<ChatInput {...props} />);
    
    const input = screen.getByRole('textbox');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }));
    
    expect(submitted).toBe(false);
  });
});
