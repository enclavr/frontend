'use client';

import { useCallback, useState } from 'react';

export function useToggle(
  initialValue: boolean = false
): [
  boolean,
  (value?: boolean) => void,
  () => void
] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback((newValue?: boolean) => {
    if (typeof newValue === 'boolean') {
      setValue(newValue);
    } else {
      setValue(prev => !prev);
    }
  }, []);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  return [value, toggle, setTrue];
}

export interface UseMultiToggleOptions {
  defaultValue?: string;
}

export function useMultiToggle(
  options: UseMultiToggleOptions = {}
): [
  string | null,
  (key: string) => void,
  (key: string) => void,
  () => void
] {
  const [activeKey, setActiveKey] = useState<string | null>(options.defaultValue ?? null);

  const activate = useCallback((key: string) => {
    setActiveKey(key);
  }, []);

  const deactivate = useCallback((key: string) => {
    setActiveKey(current => current === key ? null : current);
  }, []);

  const deactivateAll = useCallback(() => {
    setActiveKey(null);
  }, []);

  return [activeKey, activate, deactivate, deactivateAll];
}
