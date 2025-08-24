import React from 'react';
import { render } from '@testing-library/react-native';

// Mock all context providers
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../context/HabitContext', () => ({
  HabitProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useHabits: () => ({
    habits: [],
    addHabit: jest.fn(),
    updateHabit: jest.fn(),
    deleteHabit: jest.fn(),
    toggleHabitCompletion: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('../context/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    currentTheme: {
      colors: {
        background: '#ffffff',
        text: '#000000',
        primary: '#4F46E5',
        secondary: '#6B7280',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      dark: false,
    },
    toggleTheme: jest.fn(),
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLanguage: () => ({
    currentLanguage: 'en',
    t: (key: string) => key, // Return the key as-is for testing
    changeLanguage: jest.fn(),
  }),
}));

jest.mock('../context/SubscriptionContext', () => ({
  SubscriptionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSubscription: () => ({
    subscription: null,
    isLoading: false,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
}));

// Custom render function with all providers
export const renderWithProviders = (component: React.ReactElement) => {
  return render(component);
};

// Re-export everything from testing library
export * from '@testing-library/react-native';
