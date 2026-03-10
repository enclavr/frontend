import * as Sentry from '@sentry/nextjs';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason, {
      tags: {
        type: 'unhandled-promise-rejection',
      },
    });
  });

  window.addEventListener('error', (event) => {
    if (event.message === 'ResizeObserver loop limit exceeded' || 
        event.message === 'ResizeObserver loop completed with undelivered notifications') {
      return;
    }
    
    Sentry.captureException(event.error || new Error(event.message), {
      tags: {
        type: 'window-error',
      },
    });
  });
}

export function initSentryClient() {
  return null;
}

export { Sentry };
