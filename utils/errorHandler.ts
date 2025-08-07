// Error Handling Utilities

export interface AppError {
  id: string;
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  stack?: string;
}

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}

export interface ErrorHandlerOptions {
  showUserMessage?: boolean;
  logError?: boolean;
  reportError?: boolean;
  retryable?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

export class AppErrorHandler {
  private static instance: AppErrorHandler;
  private errorHistory: AppError[] = [];
  private maxHistorySize = 100;

  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  createError(
    type: ErrorType,
    message: string,
    userMessage?: string,
    details?: any,
    code?: string
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      type,
      message,
      userMessage: userMessage || this.getDefaultUserMessage(type),
      code,
      details,
      timestamp: new Date(),
      stack: new Error().stack,
    };

    this.addToHistory(error);
    return error;
  }

  handleError(
    error: Error | AppError | string,
    options: ErrorHandlerOptions = {}
  ): AppError {
    const {
      showUserMessage = true,
      logError = true,
      reportError = false,
      retryable = false,
      retryCount = 0,
      maxRetries = 3,
    } = options;

    let appError: AppError;

    if (typeof error === 'string') {
      appError = this.createError(ErrorType.UNKNOWN, error);
    } else if (this.isAppError(error)) {
      appError = error;
    } else {
      appError = this.createError(
        this.categorizeError(error),
        error.message,
        undefined,
        { originalError: error },
        error.name
      );
    }

    // Log error if enabled
    if (logError) {
      this.logError(appError);
    }

    // Report error if enabled
    if (reportError) {
      this.reportError(appError);
    }

    // Show user message if enabled
    if (showUserMessage) {
      this.showUserMessage(appError);
    }

    return appError;
  }

  handleAsyncError<T>(
    promise: Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T> {
    return promise.catch((error) => {
      this.handleError(error, options);
      throw error;
    });
  }

  handleNetworkError(error: any): AppError {
    let type = ErrorType.NETWORK;
    let message = 'Network error occurred';
    let userMessage = 'Unable to connect to the server. Please check your internet connection.';

    if (error.code === 'NETWORK_ERROR') {
      message = 'Network connection failed';
      userMessage = 'No internet connection. Please check your network settings.';
    } else if (error.code === 'TIMEOUT') {
      message = 'Request timeout';
      userMessage = 'The request took too long. Please try again.';
    } else if (error.status >= 500) {
      type = ErrorType.SERVER;
      message = 'Server error';
      userMessage = 'Server is temporarily unavailable. Please try again later.';
    } else if (error.status === 404) {
      type = ErrorType.NOT_FOUND;
      message = 'Resource not found';
      userMessage = 'The requested resource was not found.';
    } else if (error.status === 401) {
      type = ErrorType.AUTHENTICATION;
      message = 'Authentication failed';
      userMessage = 'Please log in again to continue.';
    } else if (error.status === 403) {
      type = ErrorType.AUTHORIZATION;
      message = 'Access denied';
      userMessage = 'You do not have permission to access this resource.';
    }

    return this.createError(type, message, userMessage, error, error.code);
  }

  handleValidationError(field: string, message: string): AppError {
    return this.createError(
      ErrorType.VALIDATION,
      `Validation error for field ${field}: ${message}`,
      `Please check the ${field} field and try again.`,
      { field, message }
    );
  }

  isRetryableError(error: AppError): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.SERVER,
    ].includes(error.type);
  }

  shouldRetry(error: AppError, retryCount: number, maxRetries: number): boolean {
    return this.isRetryableError(error) && retryCount < maxRetries;
  }

  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  getErrorsByType(type: ErrorType): AppError[] {
    return this.errorHistory.filter(error => error.type === type);
  }

  getRecentErrors(count: number = 10): AppError[] {
    return this.errorHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(error: AppError): void {
    this.errorHistory.push(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  private isAppError(error: any): error is AppError {
    return error && typeof error === 'object' && 'type' in error && 'id' in error;
  }

  private categorizeError(error: Error): ErrorType {
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return ErrorType.NETWORK;
    }
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return ErrorType.VALIDATION;
    }
    if (error.name === 'AuthenticationError' || error.message.includes('auth')) {
      return ErrorType.AUTHENTICATION;
    }
    if (error.name === 'AuthorizationError' || error.message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }
    if (error.name === 'NotFoundError' || error.message.includes('not found')) {
      return ErrorType.NOT_FOUND;
    }
    return ErrorType.UNKNOWN;
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Network connection error. Please check your internet connection.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in again to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.SERVER:
        return 'Server error. Please try again later.';
      case ErrorType.CLIENT:
        return 'Something went wrong. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private logError(error: AppError): void {
    if (__DEV__) {
      console.error('App Error:', {
        id: error.id,
        type: error.type,
        message: error.message,
        userMessage: error.userMessage,
        code: error.code,
        details: error.details,
        timestamp: error.timestamp,
        stack: error.stack,
      });
    }
  }

  private reportError(error: AppError): void {
    // In a real app, you would send this to your error reporting service
    // Example: Sentry.captureException(error);
    console.log('Error reported:', error);
  }

  private showUserMessage(error: AppError): void {
    // In a real app, you would show this in a toast or modal
    // For now, we'll use console.log
    console.log('User message:', error.userMessage);
  }
}

// Convenience functions
export const errorHandler = AppErrorHandler.getInstance();

export const handleError = (error: Error | AppError | string, options?: ErrorHandlerOptions) => {
  return errorHandler.handleError(error, options);
};

export const handleAsyncError = <T>(promise: Promise<T>, options?: ErrorHandlerOptions) => {
  return errorHandler.handleAsyncError(promise, options);
};

export const handleNetworkError = (error: any) => {
  return errorHandler.handleNetworkError(error);
};

export const handleValidationError = (field: string, message: string) => {
  return errorHandler.handleValidationError(field, message);
}; 