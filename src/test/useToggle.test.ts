import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToggle, useMultiToggle } from '@/hooks/useToggle';

describe('useToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default false value', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('should initialize with provided initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('should toggle value when toggle is called without argument', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(false);
  });

  it('should set value to true when setTrue is called', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe(true);
  });

  it('should set value to false when toggle is called with false', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
  });

  it('should set value to true when toggle is called with true', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1](true);
    });

    expect(result.current[0]).toBe(true);
  });

  it('should persist state across multiple toggles', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1](false);
    });
    expect(result.current[0]).toBe(false);
  });
});

describe('useMultiToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null when no default provided', () => {
    const { result } = renderHook(() => useMultiToggle());
    expect(result.current[0]).toBe(null);
  });

  it('should initialize with provided default value', () => {
    const { result } = renderHook(() => useMultiToggle({ defaultValue: 'tab1' }));
    expect(result.current[0]).toBe('tab1');
  });

  it('should activate a key when activate is called', () => {
    const { result } = renderHook(() => useMultiToggle());

    act(() => {
      result.current[1]('tab1');
    });

    expect(result.current[0]).toBe('tab1');
  });

  it('should deactivate a key when deactivate is called if it is active', () => {
    const { result } = renderHook(() => useMultiToggle({ defaultValue: 'tab1' }));

    act(() => {
      result.current[2]('tab1');
    });

    expect(result.current[0]).toBe(null);
  });

  it('should not deactivate different key when deactivate is called', () => {
    const { result } = renderHook(() => useMultiToggle({ defaultValue: 'tab1' }));

    act(() => {
      result.current[2]('tab2');
    });

    expect(result.current[0]).toBe('tab1');
  });

  it('should deactivate all keys when deactivateAll is called', () => {
    const { result } = renderHook(() => useMultiToggle({ defaultValue: 'tab1' }));

    act(() => {
      result.current[1]('tab2');
    });

    expect(result.current[0]).toBe('tab2');

    act(() => {
      result.current[3]();
    });

    expect(result.current[0]).toBe(null);
  });

  it('should switch between different keys', () => {
    const { result } = renderHook(() => useMultiToggle());

    act(() => {
      result.current[1]('tab1');
    });
    expect(result.current[0]).toBe('tab1');

    act(() => {
      result.current[1]('tab2');
    });
    expect(result.current[0]).toBe('tab2');

    act(() => {
      result.current[1]('tab3');
    });
    expect(result.current[0]).toBe('tab3');
  });
});
