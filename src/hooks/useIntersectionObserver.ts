'use client';

import { useEffect, useState, useRef, RefObject } from 'react';

export interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  freezeOnceVisible?: boolean;
}

export interface IntersectionObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  target: Element;
  time: number;
}

export function useIntersectionObserver<T extends Element = Element>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T | null>, IntersectionObserverEntry | null] {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    freezeOnceVisible = false,
  } = options;

  const targetRef = useRef<T>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isFrozen, setIsFrozen] = useState(freezeOnceVisible);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    if (isFrozen && freezeOnceVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((obsEntry) => {
          setEntry({
            isIntersecting: obsEntry.isIntersecting,
            intersectionRatio: obsEntry.intersectionRatio,
            boundingClientRect: obsEntry.boundingClientRect,
            intersectionRect: obsEntry.intersectionRect,
            rootBounds: obsEntry.rootBounds,
            target: obsEntry.target,
            time: obsEntry.time,
          });

          if (freezeOnceVisible && obsEntry.isIntersecting) {
            setIsFrozen(true);
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, freezeOnceVisible, isFrozen]);

  return [targetRef, entry];
}

export function useInfiniteScroll<T extends Element = Element>(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
): RefObject<T | null> {
  const [scrollRef, entry] = useIntersectionObserver<T>({
    root: options.root,
    rootMargin: options.rootMargin || '100px',
    threshold: options.threshold || 0,
    freezeOnceVisible: options.freezeOnceVisible || false,
  });

  useEffect(() => {
    if (entry?.isIntersecting) {
      callback();
    }
  }, [entry?.isIntersecting, callback]);

  return scrollRef;
}
