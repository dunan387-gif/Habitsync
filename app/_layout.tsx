import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { ErrorProvider, useError } from '@/context/ErrorContext';
import ErrorToast from '@/components/ErrorToast';
import { PerformanceAlertsProvider } from '@/context/PerformanceAlertsContext';
import PerformanceAlerts from '@/components/PerformanceAlerts';
import { SubscriptionProvider, useSubscription } from '@/context/SubscriptionContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { CelebrationProvider, useCelebration } from '@/context/CelebrationContext';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import ProtectedRoute from '@/components/ProtectedRoute';
import MoodHabitOnboarding from '@/components/MoodHabitOnboarding';
import ErrorBoundary from '@/components/ErrorBoundary';
import { EncryptionService } from '@/services/EncryptionService';
// import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { HabitProvider } from '@/context/HabitContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { requestNotificationPermissions } from '@/services/NotificationService';

function RootLayoutContent() {
  const { t } = useLanguage();
  const { user, isGuestUser } = useAuth();
  const { currentTheme } = useTheme();
  const { currentError } = useError();
  const { currentCelebration, hideCelebration } = useCelebration();

  return (
    <ErrorBoundary>
      <MoodHabitOnboarding>
        {!user ? (
          // No user - show auth screens
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: currentTheme.colors.background,
              },
              headerTintColor: currentTheme.colors.text,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        ) : (
          // User exists - show main app
          <ProtectedRoute>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: currentTheme.colors.background,
                },
                headerTintColor: currentTheme.colors.text,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                headerShown: false, // Hide all headers by default
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="mood-tracking" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: true, title: t('profile.title') }} />
              <Stack.Screen name="habit/[id]" options={{ headerShown: true, title: t('habit_details') }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            
            {currentCelebration && (
              <CelebrationOverlay
                visible={!!currentCelebration}
                type={currentCelebration.type}
                message={currentCelebration.message}
                onComplete={hideCelebration}
              />
            )}
            
            {/* Global Performance Alerts */}
            <PerformanceAlerts />
            
            {/* Global Error Toast */}
            <ErrorToastContainer />
            
          </ProtectedRoute>
        )}
      </MoodHabitOnboarding>
    </ErrorBoundary>
  );
}

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

export default function RootLayout() {
  // Initialize encryption when the app starts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await EncryptionService.initializeEncryption();
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
      }
    };
    
    initializeApp();
  }, []);

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
                      <RootLayoutContent />
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
