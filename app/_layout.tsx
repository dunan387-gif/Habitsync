import React from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { HabitProvider } from '@/context/HabitContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import { requestNotificationPermissions } from '@/services/NotificationService';
import { CelebrationProvider } from '@/context/CelebrationContext';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import { useCelebration } from '@/context/CelebrationContext';
import { GamificationProvider } from '@/context/GamificationContext';

function RootLayoutContent() {
  const { currentCelebration, hideCelebration } = useCelebration();
  
  return (
    <>
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="habit/[id]" options={{ headerShown: false }} />
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
    </>
  );
}

export default function RootLayout() {
  return (
    // Change the provider order so GamificationProvider wraps HabitProvider
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <CelebrationProvider>
            <GamificationProvider>
              <HabitProvider>
                <RootLayoutContent />
              </HabitProvider>
            </GamificationProvider>
          </CelebrationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}