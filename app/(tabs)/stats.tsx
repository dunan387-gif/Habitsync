import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BarChart2, LineChart } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import ProgressChart from '@/components/ProgressChart';
import StreakCalendar from '@/components/StreakCalendar';
import HabitStats from '@/components/HabitStats';

export default function StatsScreen() {
  const { habits, getCompletionRate } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  // Calculate completion rate for the last 7 days
  const weeklyCompletionRate = getCompletionRate(7);
  
  // Find the habit with the longest streak
  const topHabit = habits?.reduce((prev, current) => {
    return (prev.streak > current.streak) ? prev : current;
  }, { title: 'None', streak: 0 });

  const styles = createStyles(currentTheme.colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.title}>{t('your_progress')}</Text>
        <Text style={styles.subtitle}>{t('track_consistency')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>{t('weekly_completion')}</Text>
            <Text style={styles.statsValue}>{weeklyCompletionRate}%</Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>{t('best_streak')}</Text>
            <Text style={styles.statsValue}>{topHabit?.streak || 0} {t('days')}</Text>
            <Text style={styles.statsSubtext}>{topHabit?.title}</Text>
          </View>
          
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>{t('total_habits')}</Text>
            <Text style={styles.statsValue}>{habits?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>{t('last_7_days')}</Text>
            <View style={styles.chartToggle}>
              <TouchableOpacity 
                style={[styles.toggleButton, chartType === 'bar' && styles.activeToggle]}
                onPress={() => setChartType('bar')}
              >
                <BarChart2 
                  size={20} 
                  color={chartType === 'bar' ? currentTheme.colors.primary : currentTheme.colors.textMuted} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, chartType === 'line' && styles.activeToggle]}
                onPress={() => setChartType('line')}
              >
                <LineChart 
                  size={20} 
                  color={chartType === 'line' ? currentTheme.colors.primary : currentTheme.colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>
          <ProgressChart chartType={chartType} />
        </View>

        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>{t('monthly_view')}</Text>
          <StreakCalendar />
        </View>

        <View style={styles.habitsContainer}>
          <Text style={styles.sectionTitle}>{t('habit_breakdown')}</Text>
          <HabitStats habits={habits || []} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20, // Increased from 10 to 20 for more noticeable spacing
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20, // Increased from 16 to 20
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statsSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  calendarContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  habitsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});