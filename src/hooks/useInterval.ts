'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface UseIntervalOptions {
  immediate?: boolean;
}

export function useInterval(
  callback: () => void,
  delay: number | null | undefined,
  options: UseIntervalOptions = {}
): void {
  const { immediate = false } = options;
  const savedCallback = useRef(callback);
  const savedDelay = useRef(delay);
  const immediateRef = useRef(immediate);

  useEffect(() => {
    savedCallback.current = callback;
    savedDelay.current = delay;
  }, [callback, delay]);

  useEffect(() => {
    immediateRef.current = immediate;
  }, [immediate]);

  useEffect(() => {
    if (savedDelay.current === null || savedDelay.current === undefined) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    if (immediateRef.current) {
      tick();
    }

    const id = setInterval(tick, savedDelay.current);

    return () => {
      clearInterval(id);
    };
  }, [delay]);
}

export function useTimeout(
  callback: () => void,
  delay: number | null | undefined
): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null || delay === undefined) {
      return;
    }

    const id = setTimeout(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearTimeout(id);
    };
  }, [delay]);
}

export function useImmediateInterval(
  callback: () => void,
  delay: number | null | undefined
): void {
  return useInterval(callback, delay, { immediate: true });
}
