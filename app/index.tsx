import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const { currentTheme } = useTheme();

  useEffect(() => {
    console.log('🔄 Index route - Auth state:', { 
      isLoading, 
      hasUser: !!user, 
      userEmail: user?.email,
      userId: user?.id,
      userType: user ? (user.id.startsWith('guest-') ? 'Guest' : 'Authenticated') : 'No user',
      onboardingCompleted: user?.onboardingCompleted,
      userObject: user
    });
    
    // Add immediate logging for debugging
    console.log('📍 Index component rendered with:', { isLoading, user: !!user });
    
    let navigationTimer: ReturnType<typeof setTimeout>;
    let timeoutTimer: ReturnType<typeof setTimeout>;
    
    if (!isLoading) {
      // Add a small delay to ensure auth state is fully loaded
      navigationTimer = setTimeout(() => {
        console.log('🔍 Making navigation decision...');
        console.log('  - User exists:', !!user);
        console.log('  - User ID:', user?.id);
        console.log('  - User type:', user ? (user.id.startsWith('guest-') ? 'Guest' : 'Authenticated') : 'No user');
        console.log('  - Onboarding completed:', user?.onboardingCompleted);
        
        if (user && user.id && !user.id.startsWith('guest-') && user.id !== 'anonymous') {
          // User is authenticated, navigate to main app
          console.log('✅ User authenticated, navigating to main app');
          router.replace('/(tabs)');
        } else if (user && (user.id.startsWith('guest-') || user.id === 'guest-user' || user.id === 'anonymous')) {
          // Guest user, navigate to main app (they can use the app without onboarding)
          console.log('👻 Guest user, navigating to main app');
          router.replace('/(tabs)');
        } else {
          // User is not authenticated, navigate to login
          console.log('🚪 User not authenticated, navigating to login');
          console.log('  - User object:', user);
          console.log('  - User ID check:', user?.id);
          console.log('  - Guest check:', user?.id?.startsWith('guest-'));
          router.replace('/(auth)/login');
        }
      }, 500); // Reduced delay for better responsiveness
    } else {
      console.log('⏳ Still loading auth state...');
    }
    
    // Add a timeout to prevent infinite loading
    timeoutTimer = setTimeout(() => {
      console.warn('⚠️ Auth loading timeout reached, forcing navigation to login');
      router.replace('/(auth)/login');
    }, 10000); // Reduced timeout to 10 seconds
    
    return () => {
      if (navigationTimer) clearTimeout(navigationTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [user, isLoading]);

  // Show loading screen while checking authentication
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: currentTheme.colors.background 
    }}>
      <ActivityIndicator size="large" color={currentTheme.colors.primary} />
    </View>
  );
}
