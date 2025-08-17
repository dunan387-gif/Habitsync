import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useMemoryManagement } from './useMemoryManagement';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';

interface AndroidLifecycleOptions {
  enableMemoryOptimization?: boolean;
  enablePerformanceTracking?: boolean;
  enableBackgroundCleanup?: boolean;
  onAppStateChange?: (status: AppStateStatus) => void;
}

interface AndroidLifecycleReturn {
  appState: AppStateStatus;
  isInBackground: boolean;
  isInForeground: boolean;
  lastActiveTime: number;
  backgroundDuration: number;
  optimizeForBackground: () => void;
  optimizeForForeground: () => void;
}

export const useAndroidLifecycle = (options: AndroidLifecycleOptions = {}): AndroidLifecycleReturn => {
  const {
    enableMemoryOptimization = true,
    enablePerformanceTracking = true,
    enableBackgroundCleanup = true,
    onAppStateChange
  } = options;

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastActiveTimeRef = useRef<number>(Date.now());
  const backgroundStartTimeRef = useRef<number>(0);
  const backgroundDurationRef = useRef<number>(0);

  const { optimizeMemory, clearAllCaches } = useMemoryManagement();
  const { trackEvent, clearEvents } = usePerformanceMonitoring();

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const previousAppState = appStateRef.current;
    appStateRef.current = nextAppState;

    console.log('🔄 Android App State Change:', { previousAppState, nextAppState });

    // App is going to background
    if (previousAppState === 'active' && nextAppState.match(/inactive|background/)) {
      backgroundStartTimeRef.current = Date.now();
      lastActiveTimeRef.current = Date.now();

      if (enableBackgroundCleanup) {
        optimizeForBackground();
      }

      trackEvent('app_background', Date.now() - lastActiveTimeRef.current, {
        platform: Platform.OS,
        previousState: previousAppState,
        newState: nextAppState
      });
    }

    // App is coming to foreground
    if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
      const backgroundDuration = Date.now() - backgroundStartTimeRef.current;
      backgroundDurationRef.current = backgroundDuration;

      if (enableMemoryOptimization) {
        optimizeForForeground();
      }

      trackEvent('app_foreground', backgroundDuration, {
        platform: Platform.OS,
        previousState: previousAppState,
        newState: nextAppState,
        backgroundDuration
      });
    }

    // Call custom handler if provided
    if (onAppStateChange) {
      onAppStateChange(nextAppState);
    }
  }, [enableBackgroundCleanup, enableMemoryOptimization, onAppStateChange, trackEvent]);

  // Optimize app when going to background
  const optimizeForBackground = useCallback(() => {
    console.log('🔧 Optimizing for Android background state');

    if (Platform.OS === 'android') {
      // Clear performance events to save memory
      if (enablePerformanceTracking) {
        clearEvents();
      }

      // Optimize memory for background state
      if (enableMemoryOptimization) {
        optimizeMemory();
      }

      // Clear non-essential caches
      clearAllCaches();

      trackEvent('android_background_optimization', 0, {
        platform: Platform.OS,
        optimizations: ['memory', 'cache', 'events']
      });
    }
  }, [enablePerformanceTracking, enableMemoryOptimization, clearEvents, optimizeMemory, clearAllCaches, trackEvent]);

  // Optimize app when coming to foreground
  const optimizeForForeground = useCallback(() => {
    console.log('🔧 Optimizing for Android foreground state');

    if (Platform.OS === 'android') {
      // Perform memory optimization
      if (enableMemoryOptimization) {
        optimizeMemory();
      }

      trackEvent('android_foreground_optimization', 0, {
        platform: Platform.OS,
        backgroundDuration: backgroundDurationRef.current,
        optimizations: ['memory', 'performance']
      });
    }
  }, [enableMemoryOptimization, optimizeMemory, trackEvent]);

  // Set up app state listener
  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = AppState.addEventListener('change', handleAppStateChange);

      return () => {
        subscription?.remove();
      };
    }
  }, [handleAppStateChange]);

  // Handle Android-specific lifecycle events
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Track app launch
      trackEvent('android_app_launch', 0, {
        platform: Platform.OS,
        initialAppState: AppState.currentState
      });

      // Set up periodic background optimization (every 5 minutes when in background)
      const backgroundOptimizationInterval = setInterval(() => {
        if (appStateRef.current !== 'active') {
          optimizeForBackground();
        }
      }, 5 * 60 * 1000); // 5 minutes

      return () => {
        clearInterval(backgroundOptimizationInterval);
      };
    }
  }, [trackEvent, optimizeForBackground]);

  return {
    appState: appStateRef.current,
    isInBackground: appStateRef.current !== 'active',
    isInForeground: appStateRef.current === 'active',
    lastActiveTime: lastActiveTimeRef.current,
    backgroundDuration: backgroundDurationRef.current,
    optimizeForBackground,
    optimizeForForeground
  };
};
