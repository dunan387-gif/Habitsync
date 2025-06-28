import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import HabitList from '@/components/HabitList';
import EmptyState from '@/components/EmptyState';
import StreakSummary from '@/components/StreakSummary';
import DateHeader from '@/components/DateHeader';

export default function HomeScreen() {
  const { habits, isLoading } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (habits) {
      const completed = habits.filter(habit => habit.completedToday).length;
      setCompletedCount(completed);
    }
  }, [habits]);

  const styles = createStyles(currentTheme.colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      <DateHeader />
      
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
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20, // Increased from 10 to 20 for more noticeable spacing
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 40,
  },
});