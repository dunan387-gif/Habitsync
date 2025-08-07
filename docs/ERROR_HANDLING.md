# Error Handling System

This document describes the comprehensive error handling system implemented in the productivity app.

## Overview

The error handling system provides:
- **Global Error Boundary**: Catches uncaught JavaScript errors
- **User-Friendly Error Messages**: Consistent, localized error messages
- **Error Categorization**: Automatic classification of different error types
- **Retry Mechanisms**: Built-in retry logic for recoverable errors
- **Error History**: Tracking and reporting of errors
- **Toast Notifications**: Non-intrusive error display

## Components

### 1. ErrorBoundary (`components/ErrorBoundary.tsx`)

A React error boundary that catches JavaScript errors anywhere in the component tree.

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches uncaught errors
- Displays user-friendly error screen
- Provides retry, go home, and report error options
- Shows debug information in development mode

### 2. ErrorToast (`components/ErrorToast.tsx`)

A toast notification component for displaying errors.

```tsx
import ErrorToast from '@/components/ErrorToast';

<ErrorToast
  error={currentError}
  onDismiss={clearError}
  autoHide={true}
  autoHideDelay={5000}
  position="top"
/>
```

**Features:**
- Animated slide-in/out
- Auto-hide functionality
- Retry button for recoverable errors
- Different colors for different error types

### 3. ErrorContext (`context/ErrorContext.tsx`)

Global error state management.

```tsx
import { useError, useAsyncError } from '@/context/ErrorContext';

const { showError, clearError, errorHistory } = useError();
const { handleAsync, handleAsyncWithRetry } = useAsyncError();
```

## Error Types

The system categorizes errors into the following types:

```tsx
enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown',
}
```

## Usage Examples

### Basic Error Handling

```tsx
import { useError } from '@/context/ErrorContext';
import { ErrorType } from '@/utils/errorHandler';

function MyComponent() {
  const { showError } = useError();

  const handleError = () => {
    try {
      // Some operation that might fail
      throw new Error('Something went wrong');
    } catch (error) {
      showError(error as Error, {
        type: ErrorType.CLIENT,
        userMessage: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return <Button onPress={handleError} title="Test Error" />;
}
```

### Async Error Handling

```tsx
import { useAsyncError } from '@/context/ErrorContext';

function MyComponent() {
  const { handleAsync, handleAsyncWithRetry } = useAsyncError();

  const fetchData = async () => {
    const result = await handleAsync(
      async () => {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      },
      {
        type: ErrorType.NETWORK,
        userMessage: 'Failed to load data. Please check your connection.',
      }
    );

    if (result) {
      // Handle success
      console.log('Data loaded:', result);
    }
  };

  const fetchDataWithRetry = async () => {
    const result = await handleAsyncWithRetry(
      async () => {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        return response.json();
      },
      3, // maxRetries
      1000, // delay between retries
      {
        type: ErrorType.NETWORK,
        userMessage: 'Failed to load data after multiple attempts.',
      }
    );

    if (result) {
      console.log('Data loaded:', result);
    }
  };

  return (
    <View>
      <Button onPress={fetchData} title="Fetch Data" />
      <Button onPress={fetchDataWithRetry} title="Fetch Data with Retry" />
    </View>
  );
}
```

### Network Error Handling

```tsx
import { handleNetworkError } from '@/utils/errorHandler';

async function makeApiCall() {
  try {
    const response = await fetch('/api/endpoint');
    if (!response.ok) {
      throw { status: response.status, message: 'API call failed' };
    }
    return response.json();
  } catch (error) {
    const appError = handleNetworkError(error);
    // appError will be automatically categorized and have appropriate user message
    return null;
  }
}
```

### Validation Error Handling

```tsx
import { handleValidationError } from '@/utils/errorHandler';

function validateForm(data: any) {
  if (!data.email) {
    const error = handleValidationError('email', 'Email is required');
    return false;
  }
  return true;
}
```

## Error Handler Options

```tsx
interface ErrorHandlerOptions {
  showUserMessage?: boolean;    // Show toast notification
  logError?: boolean;           // Log to console
  reportError?: boolean;        // Send to error reporting service
  retryable?: boolean;          // Can be retried
  retryCount?: number;          // Current retry attempt
  maxRetries?: number;          // Maximum retry attempts
}
```

## Best Practices

### 1. Use Appropriate Error Types

```tsx
// Good
showError(error, { type: ErrorType.NETWORK });

// Avoid
showError(error, { type: ErrorType.UNKNOWN });
```

### 2. Provide User-Friendly Messages

```tsx
// Good
showError(error, {
  userMessage: 'Unable to save your changes. Please try again.',
});

// Avoid
showError(error, {
  userMessage: 'Error 500: Internal server error',
});
```

### 3. Handle Async Operations Properly

```tsx
// Good
const result = await handleAsync(async () => {
  return await apiCall();
});

// Avoid
try {
  const result = await apiCall();
} catch (error) {
  showError(error);
}
```

### 4. Use Retry for Recoverable Errors

```tsx
// Good for network operations
const result = await handleAsyncWithRetry(
  async () => await fetch('/api/data'),
  3, // retries
  1000 // delay
);
```

### 5. Don't Catch Errors Unnecessarily

```tsx
// Good - let the error boundary handle it
function MyComponent() {
  if (someCondition) {
    throw new Error('Critical error');
  }
}

// Avoid - catching and re-throwing
function MyComponent() {
  try {
    if (someCondition) {
      throw new Error('Critical error');
    }
  } catch (error) {
    throw error; // Unnecessary
  }
}
```

## Error Reporting

The system includes built-in error reporting capabilities:

```tsx
// Error history
const { errorHistory, getErrorsByType, getRecentErrors } = useError();

// Get recent errors
const recentErrors = getRecentErrors(10);

// Get errors by type
const networkErrors = getErrorsByType(ErrorType.NETWORK);
```

## Testing Error Handling

Use the Error Handling Examples component to test different error scenarios:

1. Go to Settings
2. Tap "Error Handling Examples"
3. Test different error types and scenarios

## Integration with Existing Code

### Adding Error Handling to Existing Components

```tsx
// Before
const loadData = async () => {
  try {
    const data = await api.getData();
    setData(data);
  } catch (error) {
    console.error('Failed to load data:', error);
  }
};

// After
const loadData = async () => {
  const { handleAsync } = useAsyncError();
  
  const result = await handleAsync(
    async () => await api.getData(),
    {
      type: ErrorType.NETWORK,
      userMessage: 'Failed to load data. Please try again.',
    }
  );

  if (result) {
    setData(result);
  }
};
```

### Error Boundary Integration

```tsx
// In your app layout
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <YourAppContent />
    </ErrorBoundary>
  );
}
```

## Configuration

### Error Toast Configuration

```tsx
// Global configuration in app layout
<ErrorToast
  error={currentError}
  onDismiss={clearError}
  autoHide={true}
  autoHideDelay={5000}
  position="top"
/>
```

### Error Reporting Configuration

```tsx
// In errorHandler.ts
private reportError(error: AppError): void {
  // Configure your error reporting service here
  // Example: Sentry.captureException(error);
  console.log('Error reported:', error);
}
```

## Troubleshooting

### Common Issues

1. **Error boundary not catching errors**
   - Ensure ErrorBoundary wraps your component tree
   - Check that errors are thrown, not just logged

2. **Toast not showing**
   - Verify ErrorProvider is in the component tree
   - Check that showError is called correctly

3. **Retry not working**
   - Ensure error type is retryable (NETWORK, SERVER)
   - Check retry configuration

### Debug Mode

In development mode, the error boundary shows additional debug information:
- Error ID
- Error message
- Stack trace
- Component stack

## Future Enhancements

- Integration with external error reporting services (Sentry, Bugsnag)
- Error analytics and insights
- Custom error boundaries for specific sections
- Error recovery strategies
- Offline error queuing 