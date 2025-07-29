import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
// ✅ Remove this unused import:
// import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { HabitProvider } from '@/context/HabitContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { requestNotificationPermissions } from '@/services/NotificationService';
import { CelebrationProvider } from '@/context/CelebrationContext';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import { useCelebration } from '@/context/CelebrationContext';
import { GamificationProvider } from '@/context/GamificationContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EncryptionService } from '@/services/EncryptionService';
import MoodHabitOnboarding from '@/components/MoodHabitOnboarding';

function RootLayoutContent() {
  const { currentCelebration, hideCelebration } = useCelebration();
  const { t } = useLanguage();
  
  return (
    <MoodHabitOnboarding>
      <ProtectedRoute>
        <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
          <Stack.Screen name="habit/[id]" options={{ title: t('habit_details') }} />
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
      </ProtectedRoute>
    </MoodHabitOnboarding>
  );
}

export default function RootLayout() {
  // Initialize encryption when the app starts
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await EncryptionService.initializeEncryption();
        console.log('Encryption initialized successfully');
      } catch (error) {
        console.error('Failed to initialize encryption:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CelebrationProvider>
            <GamificationProvider>
              <HabitProvider>
                <RootLayoutContent />
              </HabitProvider>
            </GamificationProvider>
          </CelebrationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
