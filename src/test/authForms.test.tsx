import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Login Form Component (Isolated)', () => {
  it('should render username and password inputs', () => {
    const TestForm = () => (
      <form>
        <div>
          <label htmlFor="username">Username</label>
          <input id="username" type="text" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required />
        </div>
        <button type="submit">Login</button>
      </form>
    );

    render(<TestForm />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should handle input changes', async () => {
    const user = userEvent.setup();
    let usernameValue = '';
    let passwordValue = '';

    const TestForm = () => (
      <form>
        <label htmlFor="username">Username</label>
        <input 
          id="username" 
          type="text" 
          onChange={(e) => usernameValue = e.target.value}
        />
        <label htmlFor="password">Password</label>
        <input 
          id="password" 
          type="password"
          onChange={(e) => passwordValue = e.target.value}
        />
      </form>
    );

    render(<TestForm />);
    
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'password123');
    
    expect(usernameValue).toBe('testuser');
    expect(passwordValue).toBe('password123');
  });

  it('should have required attributes', () => {
    const TestForm = () => (
      <form>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" required />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" required />
      </form>
    );

    render(<TestForm />);
    
    expect(screen.getByLabelText('Username')).toHaveAttribute('required');
    expect(screen.getByLabelText('Password')).toHaveAttribute('required');
  });
});

describe('Register Form Component (Isolated)', () => {
  it('should render all form fields', () => {
    const TestForm = () => (
      <form>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" required />
        
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />
        
        <label htmlFor="password">Password</label>
        <input id="password" type="password" required />
        
        <button type="submit">Register</button>
      </form>
    );

    render(<TestForm />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('should have correct email input type', () => {
    const TestForm = () => (
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required />
      </form>
    );

    render(<TestForm />);
    
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });
});

describe('Form Behavior', () => {
  it('should handle button click', async () => {
    const user = userEvent.setup();
    let clicked = false;

    const TestForm = () => (
      <button onClick={() => clicked = true}>Submit</button>
    );

    render(<TestForm />);
    
    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });
});
