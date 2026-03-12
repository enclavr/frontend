import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMediaQuery, usePrefersDarkMode, usePrefersReducedMotion, useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';

const createMatchMediaMock = (matches: boolean) => {
  return vi.fn().mockImplementation((query: string) => ({
    matches: matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('useMediaQuery', () => {
  let originalMatchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('should return false by default when no matchMedia available', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('should return true when media query matches', () => {
    const mockMatchMedia = createMatchMediaMock(true);
    window.matchMedia = mockMatchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('should return false when media query does not match', () => {
    const mockMatchMedia = createMatchMediaMock(false);
    window.matchMedia = mockMatchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('should update when media query changes via event listener', async () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | null = null;
    
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: () => void) => {
        if (event === 'change') {
          changeHandler = handler as (event: MediaQueryListEvent) => void;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = mockMatchMedia;

    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);

    if (changeHandler) {
      act(() => {
        changeHandler!({ matches: true } as MediaQueryListEvent);
      });
    }

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should call onChange callback when provided', async () => {
    const onChange = vi.fn();
    let changeHandler: ((event: MediaQueryListEvent) => void) | undefined = undefined;
    
    const mockMatchMedia = vi.fn().mockImplementation((_query: string) => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (event === 'change') {
          changeHandler = handler as (event: MediaQueryListEvent) => void;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = mockMatchMedia;

    renderHook(() => useMediaQuery('(min-width: 768px)', { onChange }));

    if (changeHandler) {
      changeHandler({ matches: true } as MediaQueryListEvent);
    }

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListener = vi.fn();
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: removeEventListener,
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = mockMatchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('usePrefersDarkMode', () => {
  let originalMatchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('should call matchMedia with correct dark mode query', () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    
    window.matchMedia = mockMatchMedia;

    renderHook(() => usePrefersDarkMode());

    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });
});

describe('usePrefersReducedMotion', () => {
  let originalMatchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('should call matchMedia with correct reduced motion query', () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    
    window.matchMedia = mockMatchMedia;

    renderHook(() => usePrefersReducedMotion());

    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});

describe('useIsMobile', () => {
  let originalMatchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('should call matchMedia with correct mobile query', () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(max-width: 639px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsMobile());

    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 639px)');
  });
});

describe('useIsTablet', () => {
  let originalMatchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('should call matchMedia with correct tablet query', () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(min-width: 640px) and (max-width: 1023px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsTablet());

    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 640px) and (max-width: 1023px)');
  });
});

describe('useIsDesktop', () => {
  let originalMatchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('should call matchMedia with correct desktop query', () => {
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(min-width: 1024px)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    
    window.matchMedia = mockMatchMedia;

    renderHook(() => useIsDesktop());

    expect(mockMatchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });
});
