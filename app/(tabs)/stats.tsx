import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';
import { StatusBar } from 'expo-status-bar';
import { BarChart2, LineChart, TrendingUp, Calendar, Clock, Target, Award, Activity } from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import ProgressChart from '@/components/ProgressChart';
import StreakCalendar from '@/components/StreakCalendar';
import HabitStats from '@/components/HabitStats';
import ActivityLog from '../../components/ActivityLog';
import MiniProgressCharts from '../../components/MiniProgressCharts';
import ShareProgress from '@/components/ShareProgress';
import InviteFriends from '@/components/InviteFriends';

export default function StatsScreen() {
  const { habits, getCompletionRate, getDailyCompletionData } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [selectedInsightTab, setSelectedInsightTab] = useState<'overview' | 'charts' | 'activity'>('overview');

  // Calculate comprehensive stats
  const totalHabits = habits?.length || 0;
  const weeklyCompletionRate = getCompletionRate(7);
  const monthlyCompletionRate = getCompletionRate(30);
  
  // Current streak calculation
  const currentStreak = habits?.reduce((maxStreak, habit) => {
    return Math.max(maxStreak, habit.streak);
  }, 0) || 0;
  
  // Longest streak calculation
  const longestStreak = habits?.reduce((maxStreak, habit) => {
    return Math.max(maxStreak, habit.bestStreak || habit.streak);
  }, 0) || 0;
  
  // Find the habit with the longest streak
  const topHabit = habits?.reduce((prev, current) => {
    return (prev.streak > current.streak) ? prev : current;
  }, { title: 'None', streak: 0 });

  // Calculate total completed habits
  const totalCompletedToday = habits?.filter(habit => habit.completedToday).length || 0;
  const totalCompletedAllTime = habits?.reduce((total, habit) => {
    return total + habit.completedDates.length;
  }, 0) || 0;

  const styles = createStyles(currentTheme.colors);

  const renderInsightTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, selectedInsightTab === 'overview' && styles.activeTab]}
        onPress={() => setSelectedInsightTab('overview')}
      >
        <TrendingUp size={16} color={selectedInsightTab === 'overview' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />
        <Text style={[styles.tabText, selectedInsightTab === 'overview' && styles.activeTabText]}>Overview</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, selectedInsightTab === 'charts' && styles.activeTab]}
        onPress={() => setSelectedInsightTab('charts')}
      >
        <BarChart2 size={16} color={selectedInsightTab === 'charts' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />
        <Text style={[styles.tabText, selectedInsightTab === 'charts' && styles.activeTabText]}>Charts</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, selectedInsightTab === 'activity' && styles.activeTab]}
        onPress={() => setSelectedInsightTab('activity')}
      >
        <Activity size={16} color={selectedInsightTab === 'activity' ? currentTheme.colors.primary : currentTheme.colors.textMuted} />
        <Text style={[styles.tabText, selectedInsightTab === 'activity' && styles.activeTabText]}>Activity</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={styles.title}>📈 User Insights</Text>
        <Text style={styles.subtitle}>Track your progress and patterns</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Habit Stats Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>📊 Habit Stats Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Target size={24} color={currentTheme.colors.primary} />
              <Text style={styles.statValue}>{totalHabits}</Text>
              <Text style={styles.statLabel}>Total Habits</Text>
            </View>
            <View style={styles.statCard}>
              <Award size={24} color={currentTheme.colors.success} />
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={24} color={currentTheme.colors.accent} />
              <Text style={styles.statValue}>{longestStreak}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Calendar size={24} color={currentTheme.colors.primary} />
              <Text style={styles.statValue}>{weeklyCompletionRate}%</Text>
              <Text style={styles.statLabel}>Completion Rate</Text>
            </View>
          </View>
        </View>

        {/* Insight Tabs */}
        {renderInsightTabs()}

        {/* Tab Content */}
        {selectedInsightTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <View style={styles.quickStatsContainer}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{totalCompletedToday}</Text>
                <Text style={styles.quickStatLabel}>Completed Today</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{totalCompletedAllTime}</Text>
                <Text style={styles.quickStatLabel}>Total Completions</Text>
              </View>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{monthlyCompletionRate}%</Text>
                <Text style={styles.quickStatLabel}>30-Day Rate</Text>
              </View>
            </View>

            {/* Top Performing Habit */}
            <View style={styles.topHabitContainer}>
              <Text style={styles.sectionTitle}>🏆 Top Performing Habit</Text>
              <View style={styles.topHabitCard}>
                <Text style={styles.topHabitTitle}>{topHabit?.title || 'No habits yet'}</Text>
                <Text style={styles.topHabitStreak}>{topHabit?.streak || 0} day streak</Text>
              </View>
            </View>
          </>
        )}

        {selectedInsightTab === 'charts' && (
          <>
            {/* Mini Progress Charts */}
            <MiniProgressCharts />
            
            {/* Main Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>📈 Progress Trends</Text>
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
          </>
        )}

        {selectedInsightTab === 'activity' && (
          <ActivityLog />
        )}

        {/* Calendar View */}
        <View style={styles.calendarContainer}>
          <Text style={styles.sectionTitle}>📅 Monthly Overview</Text>
          <StreakCalendar />
        </View>

        {/* Individual Habit Breakdown */}
        <View style={styles.habitsContainer}>
          <Text style={styles.sectionTitle}>📋 Habit Breakdown</Text>
          <HabitStats habits={habits || []} />
        </View>

        {/* Share Progress Section */}
        <ShareProgress />
        
        {/* Invite Friends Section */}
        <InviteFriends />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
  summaryContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickStatItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  quickStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  topHabitContainer: {
    marginBottom: 24,
  },
  topHabitCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  topHabitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  topHabitStreak: {
    fontSize: 14,
    color: colors.success,
    marginTop: 4,
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

