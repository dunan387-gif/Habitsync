import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

export default function MiniProgressCharts() {
  const { habits, getDailyCompletionData } = useHabits();
  const { currentTheme } = useTheme();

  // Get last 7 days data
  const weekData = getDailyCompletionData(7);
  const last7DaysRate = weekData.reduce((sum, day) => sum + day.completionRate, 0) / 7;
  const previous7DaysData = getDailyCompletionData(14).slice(0, 7);
  const previous7DaysRate = previous7DaysData.reduce((sum, day) => sum + day.completionRate, 0) / 7;
  
  const weekTrend = last7DaysRate - previous7DaysRate;
  
  // Get individual habit mini charts
  const topHabits = habits?.slice(0, 3) || [];

  const styles = createStyles(currentTheme.colors);

  const renderTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp size={16} color={currentTheme.colors.success} />;
    if (trend < -5) return <TrendingDown size={16} color={currentTheme.colors.error} />;
    return <Minus size={16} color={currentTheme.colors.textMuted} />;
  };

  const renderMiniChart = (data: number[]) => {
    const maxValue = Math.max(...data, 1);
    return (
      <View style={styles.miniChart}>
        {data.map((value, index) => (
          <View
            key={index}
            style={[
              styles.chartBar,
              {
                height: Math.max((value / maxValue) * 30, 2),
                backgroundColor: value > 0 ? currentTheme.colors.primary : currentTheme.colors.surface,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Mini Progress Charts</Text>
      
      {/* Weekly Overview */}
      <View style={styles.weeklyOverview}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>7-Day Overview</Text>
          <View style={styles.trendContainer}>
            {renderTrendIcon(weekTrend)}
            <Text style={[
              styles.trendText,
              { color: weekTrend > 0 ? currentTheme.colors.success : weekTrend < 0 ? currentTheme.colors.error : currentTheme.colors.textMuted }
            ]}>
              {weekTrend > 0 ? '+' : ''}{weekTrend.toFixed(1)}%
            </Text>
          </View>
        </View>
        {renderMiniChart(weekData.map(day => day.completionRate))}
        <Text style={styles.chartLabel}>Last 7 days completion rate</Text>
      </View>

      {/* Individual Habit Charts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitChartsContainer}>
        {topHabits.map(habit => {
          const habitData = weekData.map(day => {
            return habit.completedDates.includes(day.date) ? 100 : 0;
          });
          
          return (
            <View key={habit.id} style={styles.habitChart}>
              <Text style={styles.habitTitle} numberOfLines={1}>{habit.title}</Text>
              {renderMiniChart(habitData)}
              <Text style={styles.habitStreak}>{habit.streak} day streak</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  weeklyOverview: {
    marginBottom: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    marginBottom: 8,
  },
  chartBar: {
    flex: 1,
    marginHorizontal: 1,
    borderRadius: 2,
    minHeight: 2,
  },
  chartLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  habitChartsContainer: {
    marginTop: 8,
  },
  habitChart: {
    width: 120,
    marginRight: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
  },
  habitTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  habitStreak: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});