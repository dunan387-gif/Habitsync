import React from 'react';
import { SafeAreaView } from 'react-native';
import MoodHabitDashboard from '@/components/MoodHabitDashboard';
import MoodHabitOnboarding from '@/components/MoodHabitOnboarding';

export default function MoodScreen() {
  return (
    <MoodHabitOnboarding>
      <SafeAreaView style={{ flex: 1 }}>
        <MoodHabitDashboard />
      </SafeAreaView>
    </MoodHabitOnboarding>
  );
}