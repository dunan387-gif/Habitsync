import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingFlow from './OnboardingFlow';
import DailyMoodReminder from './DailyMoodReminder';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

// Storage keys (copied from AuthContext for consistency)
const keys = {
  user: 'user_data',
  guestUser: 'guest_user_data',
  lastAuthenticatedUser: 'last_authenticated_user',
  privacySettings: 'privacy_settings',
  subscription: 'subscription_status',
};

interface MoodHabitOnboardingProps {
  children: React.ReactNode;
}

export default function MoodHabitOnboarding({ children }: MoodHabitOnboardingProps) {
  const { currentTheme } = useTheme();
  const { user, clearGuestUser, markOnboardingCompleted } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const styles = createStyles(currentTheme.colors);
  
  useEffect(() => {
    checkOnboardingStatus();
  }, [user?.id, user?.onboardingCompleted]);
  
  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 Checking onboarding status for user:', user ? user.email : 'No user');
      console.log('👤 User onboarding completed:', user?.onboardingCompleted);
      console.log('👤 User ID type:', user ? (user.id.startsWith('guest-') ? 'Guest' : 'Authenticated') : 'No user');
      
      // Only show onboarding for authenticated users who haven't completed it
      if (!user) {
        // No user - don't show onboarding (will be handled by auth flow)
        console.log('❌ No user found, not showing onboarding');
        setShowOnboarding(false);
      } else if (user.id.startsWith('guest-') || user.id === 'anonymous') {
        // Guest or anonymous users - don't show onboarding
        console.log('👻 Guest/anonymous user, not showing onboarding');
        setShowOnboarding(false);
      } else {
        // Authenticated user - show onboarding only if not completed
        const shouldShowOnboarding = !user.onboardingCompleted;
        console.log('✅ Authenticated user, showing onboarding:', shouldShowOnboarding);
        setShowOnboarding(shouldShowOnboarding);
      }
      
      // Clean up old global onboarding key if it exists
      try {
        const oldGlobalKey = 'mood_habit_onboarding_completed';
        const oldGlobalValue = await AsyncStorage.getItem(oldGlobalKey);
        if (oldGlobalValue) {
          await AsyncStorage.removeItem(oldGlobalKey);
          console.log('🧹 Cleaned up old global onboarding key');
        }
      } catch (cleanupError) {
        // Silent cleanup failure
      }
      
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      setShowOnboarding(false); // Default to not showing onboarding on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOnboardingComplete = async (skipped: boolean = false) => {
    try {
      console.log('🎉 Onboarding completed, skipped:', skipped);
      console.log('👤 Current user:', user ? user.email : 'No user');
      
      // Mark onboarding as completed for authenticated users
      if (user && !user.id.startsWith('guest-') && user.id !== 'anonymous') {
        console.log('✅ Marking onboarding as completed for authenticated user');
        try {
          await markOnboardingCompleted();
          console.log('✅ Onboarding completion saved successfully');
        } catch (error) {
          console.warn('⚠️ Onboarding completion had issues, but continuing:', error);
          // Continue anyway - the user has completed onboarding
        }
      } else {
        console.log('👻 Not marking onboarding for guest/anonymous user');
      }
      
      setShowOnboarding(false);
      console.log('✅ Onboarding flow hidden');
    } catch (error) {
      console.error('❌ Error in onboarding completion:', error);
      // Still hide onboarding even if there's an error
      setShowOnboarding(false);
    }
  };

  // Function to reset onboarding for testing (can be called from console)
  const resetOnboarding = async () => {
    try {
      if (user && !user.id.startsWith('guest-') && user.id !== 'anonymous') {
        console.log('🔄 Resetting onboarding for user:', user.email);
        
        // For authenticated users, we need to update the user object directly
        const updatedUser = { ...user, onboardingCompleted: false };
        
        // Update in AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        await AsyncStorage.setItem(`userData_${user.id}`, JSON.stringify(updatedUser));
        await AsyncStorage.setItem(keys.lastAuthenticatedUser, JSON.stringify(updatedUser));
        
        // Update in development cache
        if (__DEV__) {
          await AsyncStorage.setItem('dev_last_user', JSON.stringify({
            ...updatedUser,
            timestamp: Date.now()
          }));
        }
        
        // Force re-check onboarding status
        setShowOnboarding(true);
        console.log('✅ Onboarding reset successfully');
      } else {
        console.log('❌ Cannot reset onboarding for this user type');
      }
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  // Expose reset function globally for testing
  if (typeof global !== 'undefined') {
    (global as any).resetOnboarding = resetOnboarding;
    (global as any).checkOnboardingStatus = () => {
      console.log('🔍 Current onboarding status:');
      console.log('  - User:', user ? user.email : 'No user');
      console.log('  - User ID:', user ? user.id : 'No user');
      console.log('  - Onboarding completed:', user?.onboardingCompleted);
      console.log('  - Show onboarding:', showOnboarding);
      console.log('  - Is loading:', isLoading);
    };
  }
  
  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }
  
  if (showOnboarding) {
    return (
      <View style={styles.container}>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </View>
    );
  }
  
  // Wrap children with DailyMoodReminder after onboarding is complete
  return (
    <DailyMoodReminder>
      {children}
    </DailyMoodReminder>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
});