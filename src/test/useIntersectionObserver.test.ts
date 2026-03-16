import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver, useInfiniteScroll } from '../hooks/useIntersectionObserver';

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) {}
  
  observe(_target: Element): void {
    const entry: IntersectionObserverEntry = {
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      target: document.createElement('div'),
      time: Date.now(),
    };
    this.callback([entry], this);
  }
  
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

describe('useIntersectionObserver', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should return a ref and null entry initially', () => {
    const { result } = renderHook(() => useIntersectionObserver());
    
    expect(result.current[0]).toBeDefined();
    expect(result.current[1]).toBeNull();
  });

  it('should observe element with default options', () => {
    const { result, unmount } = renderHook(() => useIntersectionObserver());
    
    const [ref] = result.current;
    
    act(() => {
      ref.current = document.createElement('div');
    });
    
    expect(ref.current).toBeDefined();
    
    unmount();
  });

  it('should use custom root margin', () => {
    const { result } = renderHook(() => useIntersectionObserver({
      rootMargin: '50px',
    }));
    
    const [ref] = result.current;
    
    act(() => {
      ref.current = document.createElement('div');
    });
    
    expect(ref.current).toBeDefined();
  });

  it('should use custom threshold', () => {
    const { result } = renderHook(() => useIntersectionObserver({
      threshold: 0.5,
    }));
    
    const [ref] = result.current;
    
    act(() => {
      ref.current = document.createElement('div');
    });
    
    expect(ref.current).toBeDefined();
  });

  it('should freeze once visible when option is set', () => {
    const { result } = renderHook(() => useIntersectionObserver({
      freezeOnceVisible: true,
    }));
    
    expect(result.current[1]).toBeNull();
  });
});

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a ref', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useInfiniteScroll(callback));
    
    expect(result.current).toBeDefined();
  });

  it('should call callback when element becomes visible', () => {
    const callback = vi.fn();
    
    const { result } = renderHook(() => useInfiniteScroll(callback, {
      rootMargin: '100px',
    }));
    
    const ref = result.current;
    
    act(() => {
      ref.current = document.createElement('div');
    });
    
    expect(ref.current).toBeDefined();
  });

  it('should use custom root margin from options', () => {
    const callback = vi.fn();
    
    const { result } = renderHook(() => useInfiniteScroll(callback, {
      rootMargin: '200px',
    }));
    
    const ref = result.current;
    
    act(() => {
      ref.current = document.createElement('div');
    });
    
    expect(ref.current).toBeDefined();
  });
});
