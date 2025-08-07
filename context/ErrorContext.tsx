import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AppError, ErrorType, errorHandler, ErrorHandlerOptions } from '@/utils/errorHandler';

interface ErrorContextType {
  currentError: AppError | null;
  errorHistory: AppError[];
  showError: (error: AppError | Error | string, options?: ErrorHandlerOptions) => void;
  clearError: () => void;
  clearErrorHistory: () => void;
  getErrorsByType: (type: ErrorType) => AppError[];
  getRecentErrors: (count?: number) => AppError[];
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export function ErrorProvider({ children }: ErrorProviderProps) {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [errorHistory, setErrorHistory] = useState<AppError[]>([]);

  const showError = useCallback((error: AppError | Error | string, options?: ErrorHandlerOptions) => {
    const appError = errorHandler.handleError(error, {
      showUserMessage: false, // We'll handle this ourselves
      ...options,
    });

    setCurrentError(appError);
    
    // Add to history
    setErrorHistory(prev => {
      const newHistory = [appError, ...prev];
      // Keep only last 50 errors
      return newHistory.slice(0, 50);
    });
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const clearErrorHistory = useCallback(() => {
    setErrorHistory([]);
    errorHandler.clearErrorHistory();
  }, []);

  const getErrorsByType = useCallback((type: ErrorType) => {
    return errorHistory.filter(error => error.type === type);
  }, [errorHistory]);

  const getRecentErrors = useCallback((count: number = 10) => {
    return errorHistory.slice(0, count);
  }, [errorHistory]);

  const value: ErrorContextType = {
    currentError,
    errorHistory,
    showError,
    clearError,
    clearErrorHistory,
    getErrorsByType,
    getRecentErrors,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}

// Hook for handling async operations with error handling
export function useAsyncError() {
  const { showError } = useError();

  const handleAsync = useCallback(async function<T>(
    asyncFn: () => Promise<T>,
    options?: ErrorHandlerOptions
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      showError(error as Error, options);
      return null;
    }
  }, [showError]);

  const handleAsyncWithRetry = useCallback(async function<T>(
    asyncFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    options?: ErrorHandlerOptions
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }

    // All retries failed
    showError(lastError!, options);
    return null;
  }, [showError]);

  return {
    handleAsync,
    handleAsyncWithRetry,
  };
} 