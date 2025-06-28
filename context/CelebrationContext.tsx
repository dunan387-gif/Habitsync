import React, { createContext, useContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type CelebrationType = 'streak' | 'allComplete' | 'milestone';

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

const ANIMATIONS_STORAGE_KEY = '@productivity_app_animations';

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [currentCelebration, setCurrentCelebration] = useState<CelebrationData | null>(null);
  const [animationsEnabled, setAnimationsEnabledState] = useState(true);

  // Load animation preference on mount
  React.useEffect(() => {
    loadAnimationPreference();
  }, []);

  const loadAnimationPreference = async () => {
    try {
      const stored = await AsyncStorage.getItem(ANIMATIONS_STORAGE_KEY);
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
      await AsyncStorage.setItem(ANIMATIONS_STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Failed to save animation preference:', error);
    }
  };

  const showCelebration = (type: CelebrationType, message: string) => {
    if (!animationsEnabled) return;
    
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