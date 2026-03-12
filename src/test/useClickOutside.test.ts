import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClickOutside, useClickAway } from '@/hooks/useClickOutside';
import { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

describe('useClickOutside', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should call handler when clicking outside the element', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickOutside(ref as any, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    fireEvent.mouseDown(outsideElement);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside the element', () => {
    const handler = vi.fn();
    const innerElement = document.createElement('div');
    container.appendChild(innerElement);
    const ref = { current: container };

    renderHook(() => useClickOutside(ref as any, handler));

    fireEvent.mouseDown(innerElement);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when disabled', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() =>
      useClickOutside(ref as any, handler, { enabled: false })
    );

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    fireEvent.mouseDown(outsideElement);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(outsideElement);
  });

  it('should work with touch events', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickOutside(ref as any, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    fireEvent.touchStart(outsideElement);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it('should clean up event listeners on unmount', () => {
    const handler = vi.fn();
    const ref = { current: container };

    const { unmount } = renderHook(() =>
      useClickOutside(ref as any, handler)
    );

    unmount();

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    fireEvent.mouseDown(outsideElement);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(outsideElement);
  });
});

describe('useClickAway', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should call handler when pressing Escape', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickAway(ref as any, handler));

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should call handler when clicking outside the element', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickAway(ref as any, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    fireEvent.mouseDown(outsideElement);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside the element', () => {
    const handler = vi.fn();
    const innerElement = document.createElement('div');
    container.appendChild(innerElement);
    const ref = { current: container };

    renderHook(() => useClickAway(ref as any, handler));

    fireEvent.mouseDown(innerElement);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler for non-Escape keys', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickAway(ref as any, handler));

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should work with touch events', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickAway(ref as any, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    fireEvent.touchStart(outsideElement);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });
});
