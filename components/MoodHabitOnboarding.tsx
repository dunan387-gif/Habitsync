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
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const styles = createStyles(currentTheme.colors);
  
  useEffect(() => {
    checkOnboardingStatus();
  }, [user?.id]);
  
  const checkOnboardingStatus = async () => {
    try {
      // Use user-specific onboarding key
      const userId = user?.id || 'anonymous';
      const onboardingKey = `mood_habit_onboarding_completed_${userId}`;
      const hasCompletedOnboarding = await AsyncStorage.getItem(onboardingKey);
      
      console.log('🔍 Checking onboarding status for user:', userId);
      console.log('📦 Onboarding key:', onboardingKey);
      console.log('✅ Has completed onboarding:', !!hasCompletedOnboarding);
      
      // For new users (no user ID or anonymous), always show onboarding
      if (!user || user.id === 'anonymous') {
        console.log('👤 New/anonymous user - showing onboarding');
        setShowOnboarding(true);
      } else {
        setShowOnboarding(!hasCompletedOnboarding);
      }
      
      // Clean up old global onboarding key if it exists
      try {
        const oldGlobalKey = 'mood_habit_onboarding_completed';
        const oldGlobalValue = await AsyncStorage.getItem(oldGlobalKey);
        if (oldGlobalValue) {
          console.log('🧹 Cleaning up old global onboarding key');
          await AsyncStorage.removeItem(oldGlobalKey);
        }
      } catch (cleanupError) {
        console.log('Cleanup of old global key failed:', cleanupError);
      }
      
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Default to showing onboarding on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOnboardingComplete = async () => {
    try {
      // Use user-specific onboarding key
      const userId = user?.id || 'anonymous';
      const onboardingKey = `mood_habit_onboarding_completed_${userId}`;
      await AsyncStorage.setItem(onboardingKey, 'true');
      
      console.log('✅ Onboarding completed for user:', userId);
      console.log('💾 Saved to key:', onboardingKey);
      
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  // Function to reset onboarding for testing (can be called from console)
  const resetOnboarding = async () => {
    try {
      const userId = user?.id || 'anonymous';
      const onboardingKey = `mood_habit_onboarding_completed_${userId}`;
      await AsyncStorage.removeItem(onboardingKey);
      console.log('🔄 Onboarding reset for user:', userId);
      setShowOnboarding(true);
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