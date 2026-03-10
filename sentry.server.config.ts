import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',

  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERSION || 'development',

  tracesSampleRate: 1.0,

  normalizeDepth: 10,

  beforeSend(event, hint) {
    if (event.request?.url) {
      const url = new URL(event.request.url, 'http://localhost');
      if (url.pathname === '/health' || url.pathname === '/status') {
        return null;
      }
    }
    return event;
  },

  beforeSendTransaction(event) {
    if (event.transaction === 'GET /health' || event.transaction === 'GET /status') {
      return null;
    }
    return event;
  },
});
