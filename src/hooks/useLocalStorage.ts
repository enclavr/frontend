'use client';

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';

export interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: Error) => void;
}

const defaultSerializer = <T>(value: T): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const defaultDeserializer = <T>(value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
};

const subscribers = new Map<string, Set<() => void>>();

const subscribe = (key: string, callback: () => void): (() => void) => {
  if (!subscribers.has(key)) {
    subscribers.set(key, new Set());
  }
  subscribers.get(key)!.add(callback);

  return () => {
    const keySubscribers = subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.delete(callback);
      if (keySubscribers.size === 0) {
        subscribers.delete(key);
      }
    }
  };
};

const notify = (key: string): void => {
  const keySubscribers = subscribers.get(key);
  if (keySubscribers) {
    keySubscribers.forEach((callback) => callback());
  }
};

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    onError,
  } = options;

  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return deserializer(item);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('LocalStorage error');
      onError?.(err);
      return initialValue;
    }
  }, [key, initialValue, deserializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, serializer(valueToStore));
          notify(key);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('LocalStorage error');
        onError?.(err);
      }
    },
    [key, storedValue, serializer, onError]
  );

  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
        notify(key);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('LocalStorage error');
      onError?.(err);
    }
  }, [key, initialValue, onError]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent): void => {
      if (e.key === key || e.key === null) {
        setStoredValue(getStoredValue());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, getStoredValue]);

  useSyncExternalStore(
    () => subscribe(key, () => setStoredValue(getStoredValue())),
    () => storedValue,
    () => initialValue
  );

  return [storedValue, setValue, removeValue];
}
