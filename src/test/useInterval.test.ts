import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInterval, useTimeout, useImmediateInterval } from '@/hooks/useInterval';

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not call callback when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not call callback when delay is undefined', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, undefined));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not call callback when delay is 0', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 0));

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should call callback repeatedly with the specified delay', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 100));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(5);
  });

  it('should not call callback immediately by default', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 100));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should call callback immediately when immediate option is true', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 100, { immediate: true }));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should stop calling callback after unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 100));

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should update callback when it changes', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const { rerender } = renderHook(
      ({ cb, delay }) => useInterval(cb, delay),
      { initialProps: { cb: callback1, delay: 100 } }
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).not.toHaveBeenCalled();

    rerender({ cb: callback2, delay: 100 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not call callback when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, null));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should not call callback when delay is undefined', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, undefined));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should call callback after the specified delay', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 500));

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should only call callback once', () => {
    const callback = vi.fn();
    renderHook(() => useTimeout(callback, 100));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call callback after unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 100));

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useImmediateInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call callback immediately', () => {
    const callback = vi.fn();
    renderHook(() => useImmediateInterval(callback, 100));

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should call callback repeatedly after initial call', () => {
    const callback = vi.fn();
    renderHook(() => useImmediateInterval(callback, 100));

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(callback).toHaveBeenCalledTimes(3);
  });
});
