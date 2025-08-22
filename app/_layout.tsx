
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import { HabitProvider } from '@/context/HabitContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Add gesture handler import at the top level
import 'react-native-gesture-handler';

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

function AppContent() {
  const { user, isLoading } = useAuth();
  const { currentTheme } = useTheme();
  const { currentError } = useError();
  const { t, isLoading: isLanguageLoading } = useLanguage();
  const [isAppReady, setIsAppReady] = useState(false);

  // Wait for everything to be loaded before rendering
  useEffect(() => {
    if (!isLoading && !isLanguageLoading) {
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
        <Text style={{ marginTop: 8, color: currentTheme.colors.textSecondary, fontSize: 12 }}>
          {isLoading ? 'Checking authentication...' : isLanguageLoading ? 'Loading translations...' : 'Initializing app...'}
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary fallback={
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: currentTheme.colors.background
      }}>
        <Text style={{ fontSize: 18, color: currentTheme.colors.text, textAlign: 'center', marginBottom: 20 }}>
          Something went wrong while loading the app.
        </Text>
        <TouchableOpacity 
          style={{ 
            backgroundColor: currentTheme.colors.primary, 
            padding: 12, 
            borderRadius: 8 
          }}
          onPress={() => {
            // Force reload the app
            window.location.reload();
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Reload App</Text>
        </TouchableOpacity>
      </View>
    }>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit" />
        <Stack.Screen name="course" />
        <Stack.Screen name="mood-tracking" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="debug" />
        <Stack.Screen name="test-auth" />
        <Stack.Screen name="simple-test" />
        <Stack.Screen name="minimal" />
        <Stack.Screen name="+not-found" />
      </Stack>

      {/* Global Components */}
      <ErrorToastContainer />
      <PerformanceAlerts />
    </ErrorBoundary>
  );
}

// Component that uses celebration context
function CelebrationWrapper() {
  const { currentCelebration, hideCelebration } = useCelebration();
  
  return (
    <>
      {currentCelebration && (
        <CelebrationOverlay
          visible={true}
          type={currentCelebration.type || 'allComplete'}
          message={currentCelebration.message || ''}
          onComplete={hideCelebration}
        />
      )}
    </>
  );
}

// Root provider wrapper to ensure proper initialization order
function RootProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorProvider>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <CelebrationProvider>
              <HabitProvider>
                <GamificationProvider>
                  <SubscriptionProvider>
                    <PerformanceAlertsProvider>
                      {children}
                      <CelebrationWrapper />
                    </PerformanceAlertsProvider>
                  </SubscriptionProvider>
                </GamificationProvider>
              </HabitProvider>
            </CelebrationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add any custom fonts here if needed
  });

  if (!fontsLoaded) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#ffffff' 
      }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#333' }}>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <RootProviderWrapper>
      <AppContent />
    </RootProviderWrapper>
  );
}
