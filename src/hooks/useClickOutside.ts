'use client';

import { useEffect, useCallback, RefObject } from 'react';

export interface UseClickOutsideOptions {
  enabled?: boolean;
}

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true } = options;

  const handleClickOutside = useCallback(
    (event: MouseEvent | TouchEvent): void => {
      const element = ref.current;
      if (!element || !enabled) return;

      if (element.contains(event.target as Node)) {
        return;
      }

      handler(event);
    },
    [ref, handler, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handleClickOutside, enabled]);
}

export function useClickAway<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  options: UseClickOutsideOptions = {}
): void {
  const { enabled = true } = options;

  const handleEvent = useCallback(
    (event: MouseEvent | TouchEvent | KeyboardEvent): void => {
      const element = ref.current;
      if (!element || !enabled) return;

      if ('key' in event) {
        if (event.key !== 'Escape') return;
        handler(event);
        return;
      }

      if (element.contains(event.target as Node)) {
        return;
      }

      handler(event);
    },
    [ref, handler, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mousedown', handleEvent);
    document.addEventListener('touchstart', handleEvent);
    document.addEventListener('keydown', handleEvent);

    return () => {
      document.removeEventListener('mousedown', handleEvent);
      document.removeEventListener('touchstart', handleEvent);
      document.removeEventListener('keydown', handleEvent);
    };
  }, [handleEvent, enabled]);
}
