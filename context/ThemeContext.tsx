import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemePreference, ThemeColors } from '@/types';
import { AVAILABLE_THEMES, LIGHT_THEME } from '@/constants/themes';

type ThemeContextType = {
  currentTheme: Theme;
  colors: ThemeColors;
  setTheme: (themeId: string) => Promise<void>;
  isLoading: boolean;
  availableThemes: Theme[];
  isPremiumUser: boolean;
  setIsPremiumUser: (isPremium: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@productivity_app_theme';
const PREMIUM_STORAGE_KEY = '@productivity_app_premium';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(LIGHT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
    loadPremiumStatus();
  }, []);

  const loadThemePreference = async () => {
    try {
      const storedPreference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
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

  const loadPremiumStatus = async () => {
    try {
      const storedPremium = await AsyncStorage.getItem(PREMIUM_STORAGE_KEY);
      if (storedPremium) {
        setIsPremiumUser(JSON.parse(storedPremium));
      }
    } catch (error) {
      console.error('Failed to load premium status:', error);
    }
  };

  const setTheme = async (themeId: string) => {
    try {
      const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
      if (!theme) {
        throw new Error(`Theme with id ${themeId} not found`);
      }

      // Check if theme requires premium
      if (theme.isPremium && !isPremiumUser) {
        throw new Error('This theme requires premium subscription');
      }

      setCurrentTheme(theme);
      
      const preference: ThemePreference = { themeId };
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      console.error('Failed to set theme:', error);
      throw error;
    }
  };

  const updatePremiumStatus = async (isPremium: boolean) => {
    setIsPremiumUser(isPremium);
    try {
      await AsyncStorage.setItem(PREMIUM_STORAGE_KEY, JSON.stringify(isPremium));
    } catch (error) {
      console.error('Failed to save premium status:', error);
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    colors: currentTheme.colors,
    setTheme,
    isLoading,
    availableThemes: AVAILABLE_THEMES,
    isPremiumUser,
    setIsPremiumUser: updatePremiumStatus,
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