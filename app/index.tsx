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
      userObject: user
    });
    
    // Add immediate logging for debugging
    console.log('📍 Index component rendered with:', { isLoading, user: !!user });
    
    if (!isLoading) {
      // Add a small delay to ensure auth state is fully loaded
      const timer = setTimeout(() => {
        if (user && user.id) {
          // User is authenticated, navigate to main app
          console.log('✅ User authenticated, navigating to main app');
          router.replace('/(tabs)');
        } else {
          // User is not authenticated, navigate to login
          console.log('🚪 User not authenticated, navigating to login');
          router.replace('/(auth)/login');
        }
      }, 500); // 500ms delay
      
      return () => clearTimeout(timer);
    } else {
      console.log('⏳ Still loading auth state...');
    }
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('⚠️ Auth loading timeout reached, forcing navigation to login');
      router.replace('/(auth)/login');
    }, 15000); // 15 second timeout
    
    return () => clearTimeout(timeout);
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
