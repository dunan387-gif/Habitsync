// Performance Alerts Context for managing alert preferences

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceAlertsSettings {
  enabled: boolean;
  showCriticalAlerts: boolean;
  showWarningAlerts: boolean;
  showInfoAlerts: boolean;
  autoDismiss: boolean;
  autoDismissDelay: number; // milliseconds
  maxAlerts: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface PerformanceAlertsContextType {
  settings: PerformanceAlertsSettings;
  updateSettings: (newSettings: Partial<PerformanceAlertsSettings>) => void;
  toggleAlerts: () => void;
  resetToDefaults: () => void;
}

const defaultSettings: PerformanceAlertsSettings = {
  enabled: false, // Disabled by default to reduce noise
  showCriticalAlerts: true,
  showWarningAlerts: false, // Disable warnings by default
  showInfoAlerts: false,
  autoDismiss: true,
  autoDismissDelay: 5000, // 5 seconds - shorter auto-dismiss
  maxAlerts: 3, // Fewer max alerts
  soundEnabled: false,
  vibrationEnabled: false,
};

const PerformanceAlertsContext = createContext<PerformanceAlertsContextType | undefined>(undefined);

export const usePerformanceAlerts = () => {
  const context = useContext(PerformanceAlertsContext);
  if (!context) {
    throw new Error('usePerformanceAlerts must be used within a PerformanceAlertsProvider');
  }
  return context;
};

interface PerformanceAlertsProviderProps {
  children: React.ReactNode;
}

export const PerformanceAlertsProvider: React.FC<PerformanceAlertsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<PerformanceAlertsSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('performanceAlertsSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsedSettings });
        }
      } catch (error) {
        console.error('Failed to load performance alerts settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;

    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('performanceAlertsSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save performance alerts settings:', error);
      }
    };

    saveSettings();
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: Partial<PerformanceAlertsSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleAlerts = () => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  const value: PerformanceAlertsContextType = {
    settings,
    updateSettings,
    toggleAlerts,
    resetToDefaults,
  };

  return (
    <PerformanceAlertsContext.Provider value={value}>
      {children}
    </PerformanceAlertsContext.Provider>
  );
}; 