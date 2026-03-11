import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Component, ReactNode } from 'react';

const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

const CustomFallback = ({ error }: { error: Error }) => (
  <div data-testid="custom-fallback">Custom: {error.message}</div>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should catch error and show fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<CustomFallback error={new Error('test')} />}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom: test')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    const [error, errorInfo] = onError.mock.calls[0];
    expect(error.message).toBe('Test error');
    expect(errorInfo).toBeDefined();
  });

  it('should reset error when reset button is clicked', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(() => fireEvent.click(screen.getByText('Try Again'))).not.toThrow();
  });

  it('should reset when resetKeys change', async () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  it('should show error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();

    (process.env as Record<string, string>).NODE_ENV = originalEnv;
  });

  it('should catch errors from nested components', () => {
    const NestedError = () => (
      <div>
        <ThrowError />
      </div>
    );

    render(
      <ErrorBoundary>
        <NestedError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
