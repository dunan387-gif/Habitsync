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
