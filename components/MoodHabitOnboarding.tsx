import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingFlow from './OnboardingFlow';
import DailyMoodReminder from './DailyMoodReminder';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface MoodHabitOnboardingProps {
  children: React.ReactNode;
}

export default function MoodHabitOnboarding({ children }: MoodHabitOnboardingProps) {
  const { currentTheme } = useTheme();
  const { user, clearGuestUser } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const styles = createStyles(currentTheme.colors);
  
  useEffect(() => {
    checkOnboardingStatus();
  }, [user?.id]);
  
  const checkOnboardingStatus = async () => {
    try {
      // Only show onboarding for:
      // 1. No user (first app launch)
      // 2. Guest users (users with IDs starting with 'guest-')
      // 3. Anonymous users
      
      if (!user) {
        // No user - show onboarding
        setShowOnboarding(true);
      } else if (user.id === 'anonymous' || user.id.startsWith('guest-')) {
        // Guest or anonymous user - check if they've completed onboarding
        const onboardingKey = `mood_habit_onboarding_completed_${user.id}`;
        const hasCompletedOnboarding = await AsyncStorage.getItem(onboardingKey);
        setShowOnboarding(!hasCompletedOnboarding);
      } else {
        // Authenticated user (real account) - never show onboarding
        setShowOnboarding(false);
      }
      
      // Clean up old global onboarding key if it exists
      try {
        const oldGlobalKey = 'mood_habit_onboarding_completed';
        const oldGlobalValue = await AsyncStorage.getItem(oldGlobalKey);
        if (oldGlobalValue) {
          await AsyncStorage.removeItem(oldGlobalKey);
        }
      } catch (cleanupError) {
        // Silent cleanup failure
      }
      
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Default to showing onboarding on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOnboardingComplete = async (skipped: boolean = false) => {
    try {
      // Only save onboarding completion for guest/anonymous users
      if (user && (user.id === 'anonymous' || user.id.startsWith('guest-'))) {
        const onboardingKey = `mood_habit_onboarding_completed_${user.id}`;
        await AsyncStorage.setItem(onboardingKey, 'true');
      }
      
      // If user is a guest user AND they skipped onboarding, redirect to login page
      if (skipped && user && user.id.startsWith('guest-')) {
        // Clear the guest user data to force login flow
        await clearGuestUser();
        // The AuthContext will handle the redirect to login when user becomes null
      }
      
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  // Function to reset onboarding for testing (can be called from console)
  const resetOnboarding = async () => {
    try {
      if (user) {
        const onboardingKey = `mood_habit_onboarding_completed_${user.id}`;
        await AsyncStorage.removeItem(onboardingKey);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  // Expose reset function globally for testing
  if (typeof global !== 'undefined') {
    (global as any).resetOnboarding = resetOnboarding;
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