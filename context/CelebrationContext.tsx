import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

type CelebrationType = 'streak' | 'allComplete' | 'milestone' | 'level_up' | 'achievement';

type CelebrationData = {
  type: CelebrationType;
  message: string;
};

type CelebrationContextType = {
  showCelebration: (type: CelebrationType, message: string) => void;
  currentCelebration: CelebrationData | null;
  hideCelebration: () => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
};

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);



export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationData | null>(null);
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);

  // Get user-specific storage key
  const getStorageKey = () => {
    const userId = user?.id || 'anonymous';
    return `@productivity_app_animations_${userId}`;
  };

  // Load animation preference on mount or when user changes
  useEffect(() => {
    // Only load data if auth is not loading
    if (!user || user.id) {
      loadAnimationPreference();
    }
  }, [user?.id]);

  const loadAnimationPreference = async () => {
    try {
      const storageKey = getStorageKey();
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored !== null) {
        setAnimationsEnabledState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load animation preference:', error);
    }
  };

  const setAnimationsEnabled = async (enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    try {
      const storageKey = getStorageKey();
      await AsyncStorage.setItem(storageKey, JSON.stringify(enabled));
    } catch (error) {
      console.error('Failed to save animation preference:', error);
    }
  };

  const showCelebration = (type: CelebrationType, message: string) => {
    if (!animationsEnabled) {
      return;
    }
    
    setCurrentCelebration({ type, message });
  };

  const hideCelebration = () => {
    setCurrentCelebration(null);
  };

  const value: CelebrationContextType = {
    showCelebration,
    currentCelebration,
    hideCelebration,
    animationsEnabled,
    setAnimationsEnabled,
  };

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}