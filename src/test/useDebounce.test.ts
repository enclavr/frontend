import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce, useDebounceFn } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should update immediately with delay of 0', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });

    expect(result.current).toBe('updated');
  });

  it('should trigger on leading edge when leading option is true', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500, { leading: true }),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });

    expect(result.current).toBe('updated');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should not trigger on trailing when trailing is false', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500, { trailing: false }),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('initial');
  });

  it('should handle rapid changes correctly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    rerender({ value: 'c' });
    rerender({ value: 'd' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('d');
  });

  it('should handle different types', () => {
    const { result: numberResult } = renderHook(() => useDebounce(123, 500));
    expect(numberResult.current).toBe(123);

    const { result: arrayResult } = renderHook(() =>
      useDebounce([1, 2, 3], 500)
    );
    expect(arrayResult.current).toEqual([1, 2, 3]);

    const { result: objectResult } = renderHook(() =>
      useDebounce({ key: 'value' }, 500)
    );
    expect(objectResult.current).toEqual({ key: 'value' });
  });

  it('should clean up timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('value', 500));
    expect(() => unmount()).not.toThrow();
  });
});

describe('useDebounceFn', () => {
  beforeEach(() => {
    if (process.env.NODE_ENV !== 'test') return;
  });

  afterEach(() => {});

  it('should call function immediately with delay of 0', () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => {
      return useDebounceFn(mockFn, 0);
    });

    act(() => {
      result.current('arg');
    });
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should debounce function calls', async () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => {
      return useDebounceFn(mockFn, 500);
    });

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(mockFn).not.toHaveBeenCalled();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 510));
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should trigger on leading edge when leading option is true', async () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => {
      return useDebounceFn(mockFn, 500, { leading: true });
    });

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(mockFn).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 510));
    });

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should not trigger on trailing when trailing is false', async () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => {
      return useDebounceFn(mockFn, 500, { trailing: false });
    });

    act(() => {
      result.current();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 510));
    });

    expect(mockFn).not.toHaveBeenCalled();
  });

  it('should pass arguments to debounced function', async () => {
    const mockFn = vi.fn();
    const { result } = renderHook(() => {
      return useDebounceFn(mockFn, 500);
    });

    act(() => {
      result.current('arg1', 'arg2');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 510));
    });

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should clean up timeout on unmount', async () => {
    const mockFn = vi.fn();
    const { unmount } = renderHook(() => useDebounceFn(mockFn, 500));

    unmount();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 510));
    });

    expect(mockFn).not.toHaveBeenCalled();
  });
});
