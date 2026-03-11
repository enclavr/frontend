'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export interface UseDebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function useDebounce<T>(
  value: T,
  delay: number,
  options: UseDebounceOptions = {}
): T {
  const { leading = false, trailing = true } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(() => {
    if (leading) return value;
    return value;
  });

  const isFirstRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leadingValueRef = useRef<T | null>(null);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (leading) {
        leadingValueRef.current = value;
      }
      return clearTimeout;
    }

    if (leading && leadingValueRef.current !== value) {
      leadingValueRef.current = value;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDebouncedValue(value);
    }

    if (delay <= 0) {
       
      setDebouncedValue(value);
      return clearTimeout;
    }

    if (trailing) {
      timeoutRef.current = setTimeout(() => {
         
        setDebouncedValue(value);
        timeoutRef.current = null;
      }, delay);
    }

    return clearTimeout;
  }, [value, delay, leading, trailing, clearTimeout]);

  return debouncedValue;
}

export interface UseDebounceFnOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function useDebounceFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  options: UseDebounceFnOptions = {}
): T {
  const { leading = false, trailing = true } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef<T>(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimeout;
  }, [clearTimeout]);

  return ((...args: Parameters<T>) => {
    if (delay <= 0) {
      return fnRef.current(...args);
    }

    if (leading && !timeoutRef.current) {
      fnRef.current(...args);
    }

    if (trailing) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!leading) {
          fnRef.current(...args);
        }
        timeoutRef.current = null;
      }, delay);
    }
  }) as T;
}
