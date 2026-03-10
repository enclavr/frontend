'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: {
          digest: error.digest,
          type: 'global-error',
        },
      });
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center border-2 border-red-200">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Critical Error</h2>
            <p className="text-gray-600 mb-4">
              A critical error occurred that prevented the app from loading. 
              Our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left overflow-auto max-h-64">
                <p className="text-sm font-mono text-red-700 whitespace-pre-wrap">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </p>
              </div>
            )}
            {error.digest && (
              <p className="text-xs text-gray-400 mb-4">Error ID: {error.digest}</p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Reload App
              </button>
              <button
                onClick={reset}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
