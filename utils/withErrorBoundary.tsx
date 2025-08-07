import React from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Error boundary helper
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
}; 