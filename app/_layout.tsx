
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { ErrorProvider, useError } from '@/context/ErrorContext';
import ErrorToast from '@/components/ErrorToast';
import { PerformanceAlertsProvider } from '@/context/PerformanceAlertsContext';
import PerformanceAlerts from '@/components/PerformanceAlerts';
import { SubscriptionProvider, useSubscription } from '@/context/SubscriptionContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { CelebrationProvider, useCelebration } from '@/context/CelebrationContext';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';
import { EncryptionService } from '@/services/EncryptionService';
import { HabitProvider } from '@/context/HabitContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { requestNotificationPermissions } from '@/services/NotificationService';
import MoodHabitOnboarding from '@/components/MoodHabitOnboarding';

function ErrorToastContainer() {
  const { currentError, clearError } = useError();
  
  return (
    <ErrorToast
      error={currentError}
      onDismiss={clearError}
      autoHide={true}
      autoHideDelay={5000}
      position="top"
    />
  );
}

function RootLayoutContent() {
  const { user, isLoading } = useAuth();
  const { currentTheme } = useTheme();
  const { currentError } = useError();
  const { t, isLoading: isLanguageLoading } = useLanguage();
  const { currentCelebration, hideCelebration } = useCelebration();
  const [isAppReady, setIsAppReady] = useState(false);

  // CRITICAL: Wait for everything to be loaded before rendering ANYTHING
  useEffect(() => {
    if (!isLoading && !isLanguageLoading) {
      // Add a small delay to ensure everything is truly ready
      const timer = setTimeout(() => {
        setIsAppReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isLanguageLoading]);

  // Show loading screen until everything is ready
  if (!isAppReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: currentTheme.colors.background
      }}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={{ marginTop: 16, color: currentTheme.colors.text }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Safe title function - only called after everything is loaded
  const safeTitle = (key: string): string => {
    try {
      const result = t(key);
      return typeof result === 'string' && result.length > 0 ? result : key;
    } catch (error) {
      console.warn('Translation error for key:', key, error);
      return key;
    }
  };

  return (
    <ErrorBoundary>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: currentTheme.colors.background,
          },
          headerTintColor: currentTheme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="mood-tracking" options={{ headerShown: false }} />
        
        <Stack.Screen 
          name="profile" 
          options={{ 
            headerShown: true, 
            title: safeTitle('profile.title') 
          }} 
        />
        <Stack.Screen 
          name="habit/[id]" 
          options={{ 
            headerShown: true, 
            title: safeTitle('habit_details') 
          }} 
        />
        <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
      </Stack>
      
      <ErrorToastContainer />
      <PerformanceAlerts />
      <CelebrationOverlay
        visible={!!currentCelebration}
        type={currentCelebration?.type || 'allComplete'}
        message={currentCelebration?.message || ''}
        onComplete={hideCelebration}
      />
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await EncryptionService.initializeEncryption();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
        setIsInitialized(true); // Continue anyway
      }
    };
    
    initializeApp();
  }, []);

  // Don't render anything until initialization is complete
  if (!isInitialized) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#4F46E5' // Use app's primary color
      }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <ThemeProvider>
          <LanguageProvider>
            <ErrorProvider>
              <CelebrationProvider>
                <GamificationProvider>
                  <PerformanceAlertsProvider>
                    <HabitProvider>
                      <MoodHabitOnboarding>
                        <RootLayoutContent />
                      </MoodHabitOnboarding>
                    </HabitProvider>
                  </PerformanceAlertsProvider>
                </GamificationProvider>
              </CelebrationProvider>
            </ErrorProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
