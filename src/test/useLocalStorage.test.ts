import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('window', {
      localStorage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should return stored value when it exists', () => {
    localStorageMock.setItem('test-key', '"stored"');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('stored');
  });

  it('should set value in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'test-key',
      '"updated"'
    );
    expect(result.current[0]).toBe('updated');
  });

  it('should set value using updater function', () => {
    const { result } = renderHook(() => useLocalStorage('count-key', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
  });

  it('should remove value from localStorage', () => {
    localStorageMock.setItem('test-key', '"stored"');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[2]();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    expect(result.current[0]).toBe('initial');
  });

  it('should handle object values', () => {
    const initial = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user-key', initial));

    act(() => {
      result.current[1]({ name: 'Jane', age: 25 });
    });

    expect(result.current[0]).toEqual({ name: 'Jane', age: 25 });
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user-key',
      '{"name":"Jane","age":25}'
    );
  });

  it('should handle array values', () => {
    const initial = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorage('array-key', initial));

    act(() => {
      result.current[1]([...initial, 4]);
    });

    expect(result.current[0]).toEqual([1, 2, 3, 4]);
  });

  it('should call onError callback on error', () => {
    const onError = vi.fn();
    const spy = vi.spyOn(localStorageMock, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial', { onError })
    );

    expect(onError).toHaveBeenCalled();
    expect(result.current[0]).toBe('initial');

    spy.mockRestore();
  });

  it('should use custom serializer', () => {
    const customSerializer = vi.fn((value: string) => value.toUpperCase());

    const { result } = renderHook(() =>
      useLocalStorage<string>('test-key', 'initial', { serializer: customSerializer })
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(customSerializer).toHaveBeenCalledWith('updated');
  });

  it('should use custom deserializer', async () => {
    const customDeserializer = vi.fn((value: string) => 'deserialized-' + value);
    localStorage.setItem('test-key', 'stored');

    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial', { deserializer: customDeserializer })
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current[0]).toBe('deserialized-stored');
    expect(customDeserializer).toHaveBeenCalledWith('stored');
  });

  it('should initialize with server-side value on SSR', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });
});
