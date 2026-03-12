'use client';

import { ReactNode } from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: ErrorBoundaryProps['onError'];
  resetKeys?: ErrorBoundaryProps['resetKeys'];
  componentName?: string;
}

export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
  resetKeys,
  componentName,
}: ErrorBoundaryWrapperProps) {
  const handleError = onError
    ? (error: Error, errorInfo: React.ErrorInfo) => {
        console.error(`[ErrorBoundaryWrapper${componentName ? ` (${componentName})` : ''}] Error caught:`, error);
        onError(error, errorInfo);
      }
    : undefined;

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={handleError}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
}

export { ErrorBoundary };
export type { ErrorBoundaryProps, ErrorBoundaryState } from './ErrorBoundary';
