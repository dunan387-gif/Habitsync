import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Habit } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

type HabitStatsProps = {
  habits: Habit[];
};

export default function HabitStats({ habits }: HabitStatsProps) {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();
  // Sort habits by streak (highest first)
  const sortedHabits = [...habits].sort((a, b) => b.streak - a.streak);

  const styles = createStyles(currentTheme.colors);

  return (
    <View style={styles.container}>
      {sortedHabits.length === 0 ? (
        <Text style={styles.emptyText}>{t('habitStats.addHabitsStatistics')}</Text>
      ) : (
        sortedHabits.map(habit => {
          // Calculate completion percentage
          const daysCreated = Math.ceil(
            (Date.now() - new Date(habit.createdAt).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          const completionRate = daysCreated > 0 
            ? (habit.completedDates.length / daysCreated) * 100 
            : 0;
          
          return (
            <View key={habit.id} style={styles.habitStats}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{habit.title}</Text>
                <Text style={styles.habitStreak}>{habit.streak} {t('habitStats.dayStreak')}</Text>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${Math.min(100, completionRate)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(completionRate)}% {t('habitStats.completionRate')}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#94A3B8',
    paddingVertical: 24,
  },
  habitStats: {
    marginBottom: 16,
  },
  habitInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textMuted,
  },
  habitStreak: {
    fontSize: 14,
    color: '#64748B',
  },
  progressContainer: {
    width: '100%',
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
});