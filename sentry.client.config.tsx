import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERSION || 'development',

  tracesSampleRate: 1.0,

  replaysOnErrorSampleRate: 1.0,

  replaysSessionSampleRate: 0.1,

  tracePropagationTargets: ['localhost', /^\//],

  normalizeDepth: 10,

  beforeSend(event, hint) {
    const error = hint?.originalException as Error | null;
    
    if (error && 'message' in error && typeof error.message === 'string') {
      if (error.message.includes('ChunkLoadError')) {
        return null;
      }
      if (error.message.includes('Failed to fetch') && error.message.includes('NetworkError')) {
        return null;
      }
    }

    if (event.request?.url) {
      const url = new URL(event.request.url, 'http://localhost');
      if (url.pathname === '/_next/webpack-hmr' || url.pathname === '/__nextjs_original-stack') {
        return null;
      }
    }

    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
    Sentry.feedbackIntegration({
      colorScheme: 'system',
    }),
  ],
});

export function SentryProvider({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error: err, resetError }) => {
        const errorMessage = err && typeof err === 'object' && 'message' in err 
          ? String((err as { message: unknown }).message) 
          : 'Unknown error';
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <div className="bg-gray-100 rounded p-3 mb-4 text-left overflow-auto max-h-32">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">{errorMessage}</pre>
              </div>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={resetError}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        );
      }}
      beforeCapture={(scope) => {
        scope.setLevel('error');
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

export function withSentry<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function WithSentry(props: P) {
    return (
      <Sentry.ErrorBoundary
        fallback={({ error: err, resetError }) => {
          const errorMessage = err && typeof err === 'object' && 'message' in err 
            ? String((err as { message: unknown }).message) 
            : 'Unknown error';
          return (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">Error in {WrappedComponent.name}: {errorMessage}</p>
              <button onClick={resetError} className="text-sm text-red-500 underline">
                Retry
              </button>
            </div>
          );
        }}
      >
        <WrappedComponent {...props} />
      </Sentry.ErrorBoundary>
    );
  };
}
