import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useHabits } from '@/context/HabitContext';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Clock,
  Award,
  Zap,
  Activity,
  Heart,
  Brain,
  Users,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react-native';
import { MoodEntry, HabitMoodEntry } from '@/types';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  habitCompletions: {
    date: string;
    completed: number;
    total: number;
  }[];
  streakData: {
    habitId: string;
    habitName: string;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  }[];
  moodTrends: {
    date: string;
    averageMood: number;
    moodCount: number;
  }[];
  performanceMetrics: {
    totalHabits: number;
    activeHabits: number;
    completionRate: number;
    averageStreak: number;
    bestPerformingHabit: string;
    needsAttention: string[];
  };
}

interface AdvancedAnalyticsDashboardProps {
  moodData?: MoodEntry[];
  habitMoodData?: HabitMoodEntry[];
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ 
  moodData = [], 
  habitMoodData = [] 
}) => {
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { canAccessAnalytics, showUpgradePrompt } = useSubscription();
  const { habits, getCompletionRate, getDailyCompletionData, getTotalCompletions, getOverallCompletionRate } = useHabits();
  
  // Safety check for currentTheme
  if (!currentTheme || !currentTheme.colors) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('analytics.loading')}</Text>
      </View>
    );
  }
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '365d'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
    if (canAccessAnalytics(days)) {
      loadAnalyticsData();
    }
  }, [selectedTimeframe, habits, moodData, habitMoodData]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Process real data instead of mock data
      const realData: AnalyticsData = {
        habitCompletions: generateRealHabitCompletions(),
        streakData: generateRealStreakData(),
        moodTrends: generateRealMoodTrends(),
        performanceMetrics: generateRealPerformanceMetrics(),
      };
      
      setAnalyticsData(realData);
    } catch (error) {
      Alert.alert(t('analytics.error'), t('analytics.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const generateRealHabitCompletions = () => {
    if (!habits || habits.length === 0) return [];
    
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const completedOnDay = habits.filter(habit => 
        habit.completedDates.includes(dateStr)
      ).length;
      
      data.push({
        date: dateStr,
        completed: completedOnDay,
        total: habits.length,
      });
    }
    return data;
  };

  const generateRealStreakData = () => {
    if (!habits || habits.length === 0) return [];
    
    return habits
      .map(habit => {
        // Calculate completion rate for the selected timeframe
        const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const completionsInTimeframe = habit.completedDates.filter(date => {
          const completionDate = new Date(date);
          return completionDate >= startDate;
        }).length;
        
        const completionRate = Math.round((completionsInTimeframe / days) * 100);
        
        return {
          habitId: habit.id,
          habitName: `${habit.icon || '📋'} ${habit.title}`,
          currentStreak: habit.streak,
          longestStreak: habit.bestStreak || habit.streak,
          completionRate: Math.max(0, Math.min(100, completionRate)),
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 4); // Top 4 habits
  };

  const generateRealMoodTrends = () => {
    if (!moodData || moodData.length === 0) return [];
    
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Filter mood data for the selected timeframe
    const timeframeMoodData = moodData.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate;
    });
    
    // Group mood data by date
    const moodByDate = timeframeMoodData.reduce((acc: any, entry) => {
      const dateStr = new Date(entry.timestamp).toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { total: 0, count: 0 };
      }
      acc[dateStr].total += entry.intensity || 5; // Default to 5 if no intensity
      acc[dateStr].count += 1;
      return acc;
    }, {});
    
    // Convert to array format
    return Object.entries(moodByDate).map(([date, data]: [string, any]) => ({
      date,
      averageMood: Math.round((data.total / data.count) * 10) / 10,
      moodCount: data.count,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const generateRealPerformanceMetrics = () => {
    if (!habits || habits.length === 0) {
      return {
        totalHabits: 0,
        activeHabits: 0,
        completionRate: 0,
        averageStreak: 0,
        bestPerformingHabit: '',
        needsAttention: [],
      };
    }
    
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Calculate active habits (habits with completions in timeframe)
    const activeHabits = habits.filter(habit => {
      return habit.completedDates.some(date => {
        const completionDate = new Date(date);
        return completionDate >= startDate;
      });
    });
    
    // Calculate completion rate for the timeframe
    const completionRate = getCompletionRate(days);
    
    // Calculate average streak
    const averageStreak = Math.round(
      habits.reduce((sum, habit) => sum + habit.streak, 0) / habits.length
    );
    
    // Find best performing habit
    const bestPerformingHabit = habits
      .sort((a, b) => b.streak - a.streak)[0];
    
    // Find habits that need attention (low completion rate or broken streaks)
    const needsAttention = habits
      .filter(habit => {
        const recentCompletions = habit.completedDates.filter(date => {
          const completionDate = new Date(date);
          return completionDate >= startDate;
        }).length;
        const recentCompletionRate = (recentCompletions / days) * 100;
        return recentCompletionRate < 30 || habit.streak === 0;
      })
      .slice(0, 2)
      .map(habit => habit.title);
    
    return {
      totalHabits: habits.length,
      activeHabits: activeHabits.length,
      completionRate: Math.round(completionRate),
      averageStreak,
      bestPerformingHabit: bestPerformingHabit ? `${bestPerformingHabit.icon || '📋'} ${bestPerformingHabit.title}` : '',
      needsAttention,
    };
  };

  const handleExportData = () => {
    if (!analyticsData) return;
    
    Alert.alert(
      t('analytics.exportTitle'),
      t('analytics.exportMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('analytics.export'), 
          onPress: () => {
            // Simulate export
            Alert.alert(t('analytics.exportSuccess'), t('analytics.exportSuccessMessage'));
          }
        },
      ]
    );
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
        {t('analytics.timeframe')}
      </Text>
      <View style={styles.timeframeButtons}>
        {[
          { key: '7d', label: t('analytics.last7Days') },
          { key: '30d', label: t('analytics.last30Days') },
          { key: '90d', label: t('analytics.last90Days') },
          { key: '365d', label: t('analytics.lastYear') },
        ].map((timeframe) => (
          <TouchableOpacity
            key={timeframe.key}
            style={[
              styles.timeframeButton,
              {
                backgroundColor: selectedTimeframe === timeframe.key 
                  ? currentTheme.colors.primary 
                  : currentTheme.colors.surface,
                borderColor: currentTheme.colors.border,
              },
            ]}
            onPress={() => setSelectedTimeframe(timeframe.key as any)}
          >
            <Text
              style={[
                styles.timeframeButtonText,
                {
                  color: selectedTimeframe === timeframe.key 
                    ? "#FFFFFF" 
                    : currentTheme.colors.text,
                },
              ]}
            >
              {timeframe.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPerformanceOverview = () => {
    if (!analyticsData) return null;
    
    const { performanceMetrics } = analyticsData;
    
    return (
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <BarChart3 size={24} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            {t('analytics.performanceOverview')}
          </Text>
        </View>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Target size={20} color={currentTheme.colors.success} />
            <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
              {performanceMetrics.totalHabits}
            </Text>
            <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.totalHabits')}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Activity size={20} color={currentTheme.colors.primary} />
            <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
              {performanceMetrics.activeHabits}
            </Text>
            <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.activeHabits')}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <TrendingUp size={20} color={currentTheme.colors.accent} />
            <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
              {performanceMetrics.completionRate}%
            </Text>
            <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.completionRate')}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Award size={20} color={currentTheme.colors.warning} />
            <Text style={[styles.metricValue, { color: currentTheme.colors.text }]}>
              {performanceMetrics.averageStreak}
            </Text>
            <Text style={[styles.metricLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.avgStreak')}
            </Text>
          </View>
        </View>
        
        {/* Show insights when there's data */}
        {performanceMetrics.totalHabits > 0 && (
          <View style={styles.insightsContainer}>
            {performanceMetrics.bestPerformingHabit && (
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: currentTheme.colors.textSecondary }]}>
                  🏆 {t('analytics.bestPerformer')}:
                </Text>
                <Text style={[styles.insightValue, { color: currentTheme.colors.success }]}>
                  {performanceMetrics.bestPerformingHabit}
                </Text>
              </View>
            )}
            
            {performanceMetrics.needsAttention.length > 0 && (
              <View style={styles.insightItem}>
                <Text style={[styles.insightLabel, { color: currentTheme.colors.textSecondary }]}>
                  ⚠️ {t('analytics.needsAttention')}:
                </Text>
                <Text style={[styles.insightValue, { color: currentTheme.colors.warning }]}>
                  {performanceMetrics.needsAttention.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderStreakAnalysis = () => {
    if (!analyticsData) return null;
    
    return (
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Clock size={24} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            {t('analytics.streakAnalysis')}
          </Text>
        </View>
        
        {analyticsData.streakData.length === 0 ? (
          <Text style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
            {t('analytics.noStreakData')}
          </Text>
        ) : (
          analyticsData.streakData.map((streak, index) => (
            <View key={streak.habitId} style={styles.streakItem}>
              <View style={styles.streakHeader}>
                <Text style={[styles.habitName, { color: currentTheme.colors.text }]}>
                  {streak.habitName}
                </Text>
                <Text style={[styles.completionRate, { color: currentTheme.colors.success }]}>
                  {streak.completionRate}%
                </Text>
              </View>
              
              <View style={styles.streakProgress}>
                <View style={styles.streakInfo}>
                  <Text style={[styles.streakLabel, { color: currentTheme.colors.textSecondary }]}>
                    {t('analytics.currentStreak')}
                  </Text>
                  <Text style={[styles.streakValue, { color: currentTheme.colors.primary }]}>
                    {streak.currentStreak} {t('analytics.days')}
                  </Text>
                </View>
                
                <View style={styles.streakInfo}>
                  <Text style={[styles.streakLabel, { color: currentTheme.colors.textSecondary }]}>
                    {t('analytics.longestStreak')}
                  </Text>
                  <Text style={[styles.streakValue, { color: currentTheme.colors.accent }]}>
                    {streak.longestStreak} {t('analytics.days')}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: currentTheme.colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${streak.completionRate}%`,
                      backgroundColor: currentTheme.colors.success,
                    }
                  ]} 
                />
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderMoodTrends = () => {
    if (!analyticsData) return null;
    
    const recentMoods = analyticsData.moodTrends.slice(-7);
    
    // Don't render if no mood data
    if (recentMoods.length === 0) {
      return (
        <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Heart size={24} color={currentTheme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
              {t('analytics.moodTrends')}
            </Text>
          </View>
          <Text style={[styles.emptyText, { color: currentTheme.colors.textSecondary }]}>
            {t('analytics.noMoodData')}
          </Text>
        </View>
      );
    }
    
    const averageMood = recentMoods.reduce((sum, mood) => sum + mood.averageMood, 0) / recentMoods.length;
    
    return (
      <View style={[styles.section, { backgroundColor: currentTheme.colors.card }]}>
        <View style={styles.sectionHeader}>
          <Heart size={24} color={currentTheme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: currentTheme.colors.text }]}>
            {t('analytics.moodTrends')}
          </Text>
        </View>
        
        <View style={styles.moodOverview}>
          <View style={styles.moodMetric}>
            <Text style={[styles.moodValue, { color: currentTheme.colors.text }]}>
              {averageMood.toFixed(1)}
            </Text>
            <Text style={[styles.moodLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.avgMood')}
            </Text>
          </View>
          
          <View style={styles.moodMetric}>
            <Text style={[styles.moodValue, { color: currentTheme.colors.text }]}>
              {recentMoods.length}
            </Text>
            <Text style={[styles.moodLabel, { color: currentTheme.colors.textSecondary }]}>
              {t('analytics.moodEntries')}
            </Text>
          </View>
        </View>
        
        <View style={styles.moodChart}>
          {recentMoods.map((mood, index) => (
            <View key={index} style={styles.moodBar}>
              <View 
                style={[
                  styles.moodBarFill,
                  { 
                    height: `${(mood.averageMood / 8) * 100}%`,
                    backgroundColor: currentTheme.colors.primary,
                  }
                ]} 
              />
              <Text style={[styles.moodDate, { color: currentTheme.colors.textSecondary }]}>
                {new Date(mood.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: currentTheme.colors.surface }]}
        onPress={loadAnalyticsData}
        disabled={isLoading}
      >
        <RefreshCw size={20} color={currentTheme.colors.primary} />
        <Text style={[styles.actionButtonText, { color: currentTheme.colors.primary }]}>
          {isLoading ? t('analytics.refreshing') : t('analytics.refresh')}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
        onPress={handleExportData}
      >
        <Download size={20} color="#FFFFFF" />
        <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
          {t('analytics.export')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!canAccessAnalytics(30)) {
    return (
      <View style={styles.upgradeContainer}>
        <BarChart3 size={48} color={currentTheme.colors.primary} />
        <Text style={[styles.upgradeTitle, { color: currentTheme.colors.text }]}>
          {t('analytics.upgradeRequired')}
        </Text>
        <Text style={[styles.upgradeMessage, { color: currentTheme.colors.textSecondary }]}>
          {t('analytics.upgradeMessage')}
        </Text>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => showUpgradePrompt('analytics_limit')}
        >
          <Text style={[styles.upgradeButtonText, { color: "#FFFFFF" }]}>
            {t('premium.upgradeToPro')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show empty state if no data
  if (!habits || habits.length === 0) {
    return (
      <View style={[styles.upgradeContainer, { backgroundColor: currentTheme.colors.background }]}>
        <BarChart3 size={48} color={currentTheme.colors.primary} />
        <Text style={[styles.upgradeTitle, { color: currentTheme.colors.text }]}>
          {t('analytics.noDataTitle')}
        </Text>
        <Text style={[styles.upgradeMessage, { color: currentTheme.colors.textSecondary }]}>
          {t('analytics.noDataMessage')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      {renderTimeframeSelector()}
      {renderPerformanceOverview()}
      {renderStreakAnalysis()}
      {renderMoodTrends()}
      {renderActionButtons()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeframeContainer: {
    padding: 20,
  },
  timeframeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 80) / 2,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  streakItem: {
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
  },
  completionRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  streakInfo: {
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  moodOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  moodMetric: {
    alignItems: 'center',
  },
  moodValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  moodLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  moodChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
  },
  moodBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  moodBarFill: {
    width: 20,
    borderRadius: 2,
    marginBottom: 8,
  },
  moodDate: {
    fontSize: 10,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightValue: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default AdvancedAnalyticsDashboard;