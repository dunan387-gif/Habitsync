import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingFlow from './OnboardingFlow';
import DailyMoodReminder from './DailyMoodReminder';
import { useTheme } from '@/context/ThemeContext';

interface MoodHabitOnboardingProps {
  children: React.ReactNode;
}

export default function MoodHabitOnboarding({ children }: MoodHabitOnboardingProps) {
  const { currentTheme } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const styles = createStyles(currentTheme.colors);
  
  useEffect(() => {
    checkOnboardingStatus();
  }, []);
  
  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('mood_habit_onboarding_completed');
      setShowOnboarding(!hasCompletedOnboarding);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true); // Default to showing onboarding on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('mood_habit_onboarding_completed', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };
  
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