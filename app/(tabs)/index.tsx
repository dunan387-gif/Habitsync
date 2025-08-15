import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';

import HabitList from '@/components/HabitList';
import EmptyState from '@/components/EmptyState';
import DateHeader from '@/components/DateHeader';
import AnalyticsCoachingHub from '@/components/AnalyticsCoachingHub';
import HabitForm from '@/components/HabitForm';
import { MoodEntry, HabitMoodEntry, Habit } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { habits, isLoading, addHabit } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { canAddHabit, showUpgradePrompt, showUpgradeAlert } = useSubscription();

  const [completedCount, setCompletedCount] = useState(0);
  const [showHabitForm, setShowHabitForm] = useState(false);

  useEffect(() => {
    if (habits) {
      const completed = habits.filter(habit => habit.completedToday).length;
      setCompletedCount(completed);
    }
  }, [habits]);

  const handleCreateHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak' | 'completedToday'>) => {
    const currentHabitsCount = habits?.length || 0;
    
    // Check if user can add more habits
    if (!canAddHabit(currentHabitsCount)) {
      showUpgradePrompt('habit_limit');
      return;
    }
    
    addHabit({
      id: Date.now().toString(),
      title: habitData.title,
      icon: habitData.icon,
      notes: habitData.notes,
      streak: 0,
      createdAt: new Date().toISOString(),
      completedToday: false,
      completedDates: [],
      reminderTime: habitData.reminderTime,
      reminderEnabled: habitData.reminderEnabled || false,
      order: currentHabitsCount,
    });
    
    setShowHabitForm(false);
  };

  const handleAddHabitPress = () => {
    const currentHabitsCount = habits?.length || 0;
    
    // Check if user can add more habits
    if (!canAddHabit(currentHabitsCount)) {
      showUpgradePrompt('habit_limit');
      return;
    }
    
    setShowHabitForm(true);
  };

  const styles = createStyles(currentTheme.colors);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
        <DateHeader />
        
        <View style={styles.scrollView}>
          <View style={styles.listContainer}>
            {isLoading ? (
              <Text style={styles.loadingText}>{t('loading_habits')}</Text>
            ) : habits && habits.length > 0 ? (
              <HabitList 
                habits={habits} 
                completedCount={completedCount}
                totalCount={habits?.length || 0}
              />
            ) : (
              <EmptyState 
                title={t('no_habits_yet')}
                message={t('add_first_habit')}
                actionLabel={t('add_habit')}
                onAction={handleAddHabitPress}
              />
            )}
          </View>
        </View>



      </SafeAreaView>
      
      {/* HabitForm Modal */}
      <HabitForm
        visible={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSave={handleCreateHabit}
      />
      

    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },

});