import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import HabitList from '@/components/HabitList';
import EmptyState from '@/components/EmptyState';
import StreakSummary from '@/components/StreakSummary';
import DateHeader from '@/components/DateHeader';
import AnalyticsCoachingHub from '@/components/AnalyticsCoachingHub';
import HabitForm from '@/components/HabitForm';
import { MoodEntry, HabitMoodEntry, Habit } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const { habits, isLoading, addHabit } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
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

  const styles = createStyles(currentTheme.colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      <DateHeader />
      
      <ScrollView style={styles.scrollView}>
        <StreakSummary 
          completedCount={completedCount} 
          totalCount={habits?.length || 0} 
        />
        
        <View style={styles.listContainer}>
          {isLoading ? (
            <Text style={styles.loadingText}>{t('loading_habits')}</Text>
          ) : habits && habits.length > 0 ? (
            <HabitList habits={habits} />
          ) : (
            <EmptyState 
              title={t('no_habits_yet')}
              message={t('add_first_habit')}
              actionLabel={t('add_habit')}
              onAction={() => setShowHabitForm(true)}
            />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {habits && habits.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowHabitForm(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {/* HabitForm Modal */}
      <HabitForm
        visible={showHabitForm}
        onClose={() => setShowHabitForm(false)}
        onSave={handleCreateHabit}
      />
    </SafeAreaView>
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
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});