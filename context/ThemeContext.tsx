import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemePreference, ThemeColors } from '@/types';
import { AVAILABLE_THEMES, LIGHT_THEME } from '@/constants/themes';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';

type ThemeContextType = {
  currentTheme: Theme;
  colors: ThemeColors;
  setTheme: (themeId: string) => Promise<void>;
  isLoading: boolean;
  availableThemes: Theme[];
  isPremiumUser: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentTier } = useSubscription();
  const [currentTheme, setCurrentTheme] = useState<Theme>(LIGHT_THEME);
  const [isLoading, setIsLoading] = useState(true);

  // Get user-specific storage keys
  const getStorageKeys = () => {
    const userId = user?.id || 'anonymous';
    return {
      theme: `@productivity_app_theme_${userId}`,
    };
  };

  // Load theme preference on app start or when user changes
  useEffect(() => {
    // Only load data if auth is not loading
    if (!user || user.id) {
      loadThemePreference();
    }
  }, [user?.id]);

  const loadThemePreference = async () => {
    try {
      const keys = getStorageKeys();
      const storedPreference = await AsyncStorage.getItem(keys.theme);
      if (storedPreference) {
        const preference: ThemePreference = JSON.parse(storedPreference);
        const theme = AVAILABLE_THEMES.find(t => t.id === preference.themeId);
        if (theme) {
          setCurrentTheme(theme);
        }
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (themeId: string) => {
    try {
      const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
      if (!theme) {
        throw new Error(`Theme with id ${themeId} not found`);
      }

      console.log('🎨 Theme validation:', {
        themeId,
        themeName: theme.name,
        isPremium: theme.isPremium,
        currentTier,
        canUse: !theme.isPremium || currentTier === 'pro'
      });

      // Check if theme requires premium using subscription context
      if (theme.isPremium && currentTier !== 'pro') {
        throw new Error('This theme requires premium subscription');
      }

      setCurrentTheme(theme);
      
      const preference: ThemePreference = { themeId };
      const keys = getStorageKeys();
      await AsyncStorage.setItem(keys.theme, JSON.stringify(preference));
      
      console.log('✅ Theme set successfully:', theme.name);
    } catch (error) {
      console.error('Failed to set theme:', error);
      throw error;
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    colors: currentTheme.colors,
    setTheme,
    isLoading,
    availableThemes: AVAILABLE_THEMES,
    isPremiumUser: currentTier === 'pro',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}