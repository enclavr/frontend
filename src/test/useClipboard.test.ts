import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '@/hooks/useClipboard';

describe('useClipboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide copy and paste functions', () => {
    const { result } = renderHook(() => useClipboard());

    expect(typeof result.current.copy).toBe('function');
    expect(typeof result.current.paste).toBe('function');
    expect(typeof result.current.isSupported).toBe('boolean');
    expect(result.current.error).toBeNull();
  });

  it('should copy text to clipboard', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: mockWriteText,
        readText: vi.fn().mockResolvedValue(''),
      },
    });

    const { result } = renderHook(() => useClipboard());

    let success = false;
    await act(async () => {
      success = await result.current.copy('test text');
    });

    expect(success).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('test text');
    expect(result.current.error).toBeNull();
  });

  it('should handle copy error', async () => {
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard error'));
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: mockWriteText,
        readText: vi.fn().mockResolvedValue(''),
      },
    });

    const { result } = renderHook(() => useClipboard());

    let success = false;
    await act(async () => {
      success = await result.current.copy('test text');
    });

    expect(success).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should read text from clipboard', async () => {
    const mockReadText = vi.fn().mockResolvedValue('pasted text');
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: mockReadText,
      },
    });

    const { result } = renderHook(() => useClipboard());

    let text = '';
    await act(async () => {
      text = await result.current.paste();
    });

    expect(text).toBe('pasted text');
    expect(result.current.error).toBeNull();
  });

  it('should handle paste error', async () => {
    const mockReadText = vi.fn().mockRejectedValue(new Error('Paste error'));
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: mockReadText,
      },
    });

    const { result } = renderHook(() => useClipboard());

    let text = '';
    await act(async () => {
      text = await result.current.paste();
    });

    expect(text).toBe('');
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should use custom timeout option', () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: mockWriteText,
        readText: vi.fn().mockResolvedValue(''),
      },
    });

    const { result } = renderHook(() => useClipboard({ timeout: 1000 }));

    expect(result.current.isSupported).toBe(true);
  });
});
