'use client';

import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  timeout?: number;
}

interface UseClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  paste: () => Promise<string>;
  isSupported: boolean;
  error: Error | null;
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000 } = options;
  const [error, setError] = useState<Error | null>(null);
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!navigator.clipboard;
  });

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!isSupported) {
      const err = new Error('Clipboard API not supported');
      setError(err);
      return false;
    }

    try {
      setError(null);
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to copy');
      setError(err);
      return false;
    }
  }, [isSupported]);

  const paste = useCallback(async (): Promise<string> => {
    if (!isSupported) {
      const err = new Error('Clipboard API not supported');
      setError(err);
      return '';
    }

    try {
      setError(null);
      const text = await navigator.clipboard.readText();
      return text;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to paste');
      setError(err);
      return '';
    }
  }, [isSupported]);

  return {
    copy,
    paste,
    isSupported,
    error,
  };
}
