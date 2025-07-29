import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Dimensions, Alert, Share } from 'react-native';
import { ScrollView } from 'react-native-virtualized-view';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BarChart2, LineChart, TrendingUp, Calendar, Clock, Target, Award, Activity, 
  BarChart3, PieChart, Filter, Flame, Trophy, Zap, Star, ChevronDown,
  Download, Share2, Users, Sparkles
} from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { MoodEntry, HabitMoodEntry } from '@/types';
import ProgressChart from '@/components/ProgressChart';
import HabitStats from '@/components/HabitStats';
import ActivityLog from '../../components/ActivityLog';
import MiniProgressCharts from '../../components/MiniProgressCharts';
import ShareProgress from '@/components/ShareProgress';
import InviteFriends from '@/components/InviteFriends';
import HabitHeatmap from '@/components/HabitHeatmap';
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard';
import PatternInsights from '@/components/PatternInsights';
import { PredictiveAnalyticsService } from '@/services/PredictiveAnalyticsService';

type TimeFilter = 'today' | 'week' | 'month';

export default function StatsScreen() {
  const { habits, getCompletionRate, getDailyCompletionData, getTotalCompletions, getOverallCompletionRate } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();

  const [selectedInsightTab, setSelectedInsightTab] = useState<'overview' | 'charts' | 'activity' | 'advanced'>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<'all' | 'completed' | 'missed'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [habitMoodData, setHabitMoodData] = useState<HabitMoodEntry[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [countAnimations] = useState({
    totalHabits: new Animated.Value(0),
    currentStreak: new Animated.Value(0),
    longestStreak: new Animated.Value(0),
    completionRate: new Animated.Value(0)
  });

  // Load mood and habit mood data
  useEffect(() => {
    const loadMoodAndHabitData = async () => {
      try {
        const [storedMoodData, storedHabitMoodData] = await Promise.all([
          AsyncStorage.getItem('moodEntries'),
          AsyncStorage.getItem('habitMoodEntries')
        ]);
        
        setMoodData(storedMoodData ? JSON.parse(storedMoodData) : []);
        setHabitMoodData(storedHabitMoodData ? JSON.parse(storedHabitMoodData) : []);
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Error loading mood and habit data:', error);
        setMoodData([]);
        setHabitMoodData([]);
        setIsDataLoaded(true);
      }
    };

    loadMoodAndHabitData();
  }, []);

  // Calculate real statistics
  const stats = useMemo(() => {
    if (!habits || habits.length === 0) {
      return {
        totalHabits: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyCompletionRate: 0,
        monthlyCompletionRate: 0,
        totalCompletedToday: 0,
        totalCompletedAllTime: 0,
        averageCompletionRate: 0
      };
    }

    // Calculate current streak (longest active streak among all habits)
    const currentStreak = Math.max(...habits.map(h => h.streak), 0);
    
    // Calculate longest streak ever
    const longestStreak = Math.max(...habits.map(h => h.bestStreak || h.streak), 0);
    
    // Get completion rates
    const weeklyCompletionRate = getCompletionRate(7);
    const monthlyCompletionRate = getCompletionRate(30);
    const averageCompletionRate = getOverallCompletionRate();
    
    // Calculate today's completions
    const today = new Date().toISOString().split('T')[0];
    const totalCompletedToday = habits.filter(h => h.completedDates.includes(today)).length;
    
    // Total completions all time
    const totalCompletedAllTime = getTotalCompletions();
    
    return {
      totalHabits: habits.length,
      currentStreak,
      longestStreak,
      weeklyCompletionRate,
      monthlyCompletionRate,
      totalCompletedToday,
      totalCompletedAllTime,
      averageCompletionRate
    };
  }, [habits, getCompletionRate, getTotalCompletions, getOverallCompletionRate]);
  
  // Get top performing habit
  const topHabit = useMemo(() => {
    if (!habits || habits.length === 0) return null;
    
    // Sort by current streak, then by completion rate
    const sortedHabits = [...habits].sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.completedDates.length - a.completedDates.length;
    });
    
    return sortedHabits[0];
  }, [habits]);
  
  // Get habit performance data for leaderboard
  const habitPerformanceData = useMemo(() => {
    if (!habits || habits.length === 0) return [];
    
    return habits
      .map(habit => {
        // Calculate completion rate for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentCompletions = habit.completedDates.filter(date => {
          const completionDate = new Date(date);
          return completionDate >= thirtyDaysAgo;
        }).length;
        
        const possibleDays = Math.min(30, Math.floor((new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const completionRate = possibleDays > 0 ? Math.round((recentCompletions / possibleDays) * 100) : 0;
        
        // Determine trend based on recent performance
        const lastWeekCompletions = habit.completedDates.filter(date => {
          const completionDate = new Date(date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return completionDate >= weekAgo;
        }).length;
        
        const previousWeekCompletions = habit.completedDates.filter(date => {
          const completionDate = new Date(date);
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return completionDate >= twoWeeksAgo && completionDate < weekAgo;
        }).length;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (lastWeekCompletions > previousWeekCompletions) trend = 'up';
        else if (lastWeekCompletions < previousWeekCompletions) trend = 'down';
        
        return {
          habit: `${habit.icon || '📋'} ${habit.title}`,
          score: completionRate,
          trend,
          color: completionRate >= 80 ? currentTheme.colors.success : 
                 completionRate >= 60 ? currentTheme.colors.primary : 
                 currentTheme.colors.accent
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4); // Top 4 habits
  }, [habits, currentTheme.colors]);
  
  // Generate weekly activity heatmap data
  const weeklyActivityData = useMemo(() => {
    if (!habits || habits.length === 0) return [];
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    return days.map((day, dayIndex) => {
      const activities = [];
      
      // Generate last 4 weeks of data for this day
      for (let week = 0; week < 4; week++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - (today.getDay() - 1 - dayIndex) - (week * 7));
        const dateStr = targetDate.toISOString().split('T')[0];
        
        const completionsOnDay = habits.filter(h => h.completedDates.includes(dateStr)).length;
        const intensity = habits.length > 0 ? completionsOnDay / habits.length : 0;
        
        activities.push({
          date: dateStr,
          intensity: Math.min(intensity, 1),
          completions: completionsOnDay
        });
      }
      
      return {
        day,
        activities: activities.reverse() // Show oldest to newest
      };
    });
  }, [habits]);

  // Motivational messages based on performance
  const getMotivationalMessage = () => {
    const messages = [
      t('stats.motivational.keepGoing'),
      t('stats.motivational.greatProgress'),
      t('stats.motivational.stayConsistent'),
      t('stats.motivational.almostThere'),
      t('stats.motivational.excellentWork')
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Export functionality
  const handleExportData = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalHabits: habits?.length || 0,
        stats: {
          currentStreak: stats.currentStreak,
          longestStreak: stats.longestStreak,
          weeklyCompletionRate: stats.weeklyCompletionRate,
          monthlyCompletionRate: stats.monthlyCompletionRate,
          totalCompletedToday: stats.totalCompletedToday,
          totalCompletedAllTime: stats.totalCompletedAllTime,
          averageCompletionRate: stats.averageCompletionRate
        },
        habits: habits?.map(habit => ({
          title: habit.title,
          icon: habit.icon,
          streak: habit.streak,
          bestStreak: habit.bestStreak,
          completedDates: habit.completedDates,
          createdAt: habit.createdAt
        })) || [],
        heatmapData: generateHeatmapData(habits || []),
        yearlyStats: {
          totalHabitsThisYear: getTotalHabitsThisYear(habits || []),
          longestStreakThisYear: getLongestStreakThisYear(habits || []),
          currentStreak: getCurrentStreak(habits || [])
        }
      };

      const csvContent = generateCSVContent(exportData);
      
      Alert.alert(
        t('stats.export.title'),
        t('stats.export.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('stats.export.json'),
            onPress: () => shareData(JSON.stringify(exportData, null, 2), 'habits-data.json')
          },
          {
            text: t('stats.export.csv'),
            onPress: () => {
              const csvData = generateCSVContent(exportData);
              shareData(csvData, 'habits-data.csv');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('stats.export.error'));
    }
  };

  const generateCSVContent = (data: any) => {
    let csv = t('csv.exportHeader') + '\n\n';
    csv += t('csv.exportDate') + ',' + data.exportDate + '\n';
    csv += t('csv.totalHabits') + ',' + data.totalHabits + '\n';
    csv += t('csv.currentStreak') + ',' + data.stats.currentStreak + '\n';
    csv += t('csv.longestStreak') + ',' + data.stats.longestStreak + '\n';
    csv += t('csv.weeklyCompletionRate') + ',' + data.stats.weeklyCompletionRate + '%\n';
    csv += t('csv.monthlyCompletionRate') + ',' + data.stats.monthlyCompletionRate + '%\n';
    csv += t('csv.totalCompletedToday') + ',' + data.stats.totalCompletedToday + '\n';
    csv += t('csv.totalCompletedAllTime') + ',' + data.stats.totalCompletedAllTime + '\n\n';
    
    csv += t('csv.habitDetails') + '\n';
    csv += t('csv.habitDetailsHeader') + '\n';
    data.habits.forEach((habit: any) => {
      csv += `"${habit.title}","${habit.icon}",${habit.streak},${habit.bestStreak},${habit.completedDates.length},${habit.createdAt}\n`;
    });
    
    return csv;
  };

  const shareData = async (content: string, filename: string) => {
    try {
      await Share.share({
        message: content,
        title: t('stats.share.title')
      });
    } catch (error) {
      Alert.alert(t('shareError.title'), t('shareError.message'));
    }
  };

  // Activity filter functionality
  const handleActivityFilter = () => {
    Alert.alert(
      t('stats.activity.filterTitle'),
      t('stats.activity.filterMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('stats.activity.all'),
          onPress: () => setSelectedActivityFilter('all')
        },
        {
          text: t('stats.activity.completed'),
          onPress: () => setSelectedActivityFilter('completed')
        },
        {
          text: t('stats.activity.missed'),
          onPress: () => setSelectedActivityFilter('missed')
        }
      ]
    );
  };

  // Social sharing functionality
  const handleShareProgress = () => {
    setShowShareModal(true);
  };

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: t('stats.invite.message'),
        title: t('stats.invite.title')
      });
    } catch (error) {
      Alert.alert(t('common.error'), t('stats.invite.error'));
    }
  };

  const styles = useMemo(() => createStyles(currentTheme.colors), [currentTheme.colors]);

  // Animate icon on mount
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate counters
    Object.entries(countAnimations).forEach(([key, animation]) => {
      const targetValue = key === 'totalHabits' ? stats.totalHabits :
                         key === 'currentStreak' ? stats.currentStreak :
                         key === 'longestStreak' ? stats.longestStreak :
                         stats.weeklyCompletionRate;
      
      Animated.timing(animation, {
        toValue: targetValue,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    });
  }, [stats]);

  const renderTimeFilter = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={[styles.filterButton, timeFilter === 'today' && styles.activeFilter]}
        onPress={() => setTimeFilter('today')}
      >
        <Text style={[styles.filterText, timeFilter === 'today' && styles.activeFilterText]}>
          {t('stats.filters.today')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, timeFilter === 'week' && styles.activeFilter]}
        onPress={() => setTimeFilter('week')}
      >
        <Text style={[styles.filterText, timeFilter === 'week' && styles.activeFilterText]}>
          {t('stats.filters.week')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterButton, timeFilter === 'month' && styles.activeFilter]}
        onPress={() => setTimeFilter('month')}
      >
        <Text style={[styles.filterText, timeFilter === 'month' && styles.activeFilterText]}>
          {t('stats.filters.month')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEnhancedStatCard = (icon: React.ReactNode, value: number, label: string, color: string, type: 'fire' | 'trophy' | 'progress' | 'default') => {
    const getCardBackground = () => {
      if (type === 'fire' && stats.currentStreak > 7) return `${currentTheme.colors.warning}15`;
      if (type === 'trophy' && stats.longestStreak > 30) return `${currentTheme.colors.success}15`;
      if (type === 'progress' && stats.weeklyCompletionRate > 80) return `${currentTheme.colors.primary}15`;
      return currentTheme.colors.card;
    };

    // Format the value properly
    const formatValue = (val: number) => {
      if (type === 'progress') {
        return `${Math.round(val)}%`;
      }
      return Math.round(val).toString();
    };

    return (
      <View style={[styles.enhancedStatCard, { backgroundColor: getCardBackground() }]}>
        <View style={styles.statIconContainer}>
          {icon}
          {type === 'fire' && stats.currentStreak > 0 && (
            <View style={styles.fireGlow}>
              <Flame size={12} color={currentTheme.colors.warning} />
            </View>
          )}
        </View>
        <Text style={[styles.statValue, { color }]}>
          {formatValue(value)}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
        {type === 'progress' && (
          <View style={styles.progressRing}>
            <View style={[
              styles.progressFill,
              { 
                width: `${Math.min(value, 100)}%`,
                backgroundColor: color
              }
            ]} />
          </View>
        )}
      </View>
    );
  };

  const renderInsightTabs = () => {
    const tabs = [
      { key: 'overview', icon: TrendingUp, label: t('stats.tabs.overview'), desc: t('stats.tabs.overviewDesc') },
      { key: 'charts', icon: BarChart2, label: t('stats.tabs.charts'), desc: t('stats.tabs.chartsDesc') },
      { key: 'activity', icon: Activity, label: t('stats.tabs.activity'), desc: t('stats.tabs.activityDesc') },
      { key: 'advanced', icon: Sparkles, label: t('stats.tabs.advanced'), desc: t('stats.tabs.advancedDesc') }
    ];

    const currentTab = tabs.find(tab => tab.key === selectedInsightTab);
    const IconComponent = currentTab?.icon || TrendingUp;

    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.dropdownButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <View style={styles.dropdownButtonContent}>
            <IconComponent size={20} color={currentTheme.colors.primary} />
            <View style={styles.dropdownButtonText}>
              <Text style={styles.dropdownLabel}>{currentTab?.label}</Text>
              <Text style={styles.dropdownDesc}>{currentTab?.desc}</Text>
            </View>
          </View>
          <ChevronDown 
            size={20} 
            color={currentTheme.colors.textMuted} 
            style={[styles.dropdownChevron, showDropdown && styles.dropdownChevronRotated]}
          />
        </TouchableOpacity>
        
        {showDropdown && (
          <View style={styles.dropdownMenu}>
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = selectedInsightTab === tab.key;
              
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                  onPress={() => {
                    setSelectedInsightTab(tab.key as any);
                    setShowDropdown(false);
                  }}
                >
                  <TabIcon 
                    size={18} 
                    color={isSelected ? currentTheme.colors.primary : currentTheme.colors.textMuted} 
                  />
                  <View style={styles.dropdownItemContent}>
                    <Text style={[styles.dropdownItemLabel, isSelected && styles.dropdownItemLabelSelected]}>
                      {tab.label}
                    </Text>
                    <Text style={styles.dropdownItemDesc}>{tab.desc}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderQuickInsightCards = () => (
    <View style={styles.quickInsightsContainer}>
      <View style={styles.quickInsightsRow}>
        <View style={styles.quickInsightCard}>
          <Zap size={20} color={currentTheme.colors.primary} />
          <Text style={styles.quickInsightValue}>{stats.totalCompletedToday}</Text>
          <Text style={styles.quickInsightLabel}>Today</Text>
          <View style={styles.sparkline}>
            <View style={styles.sparklineDot} />
            <View style={styles.sparklineDot} />
            <View style={styles.sparklineDot} />
          </View>
        </View>
        
        <View style={styles.quickInsightCard}>
          <Star size={20} color={currentTheme.colors.success} />
          <Text style={styles.quickInsightValue}>{stats.totalCompletedAllTime}</Text>
          <Text style={styles.quickInsightLabel}>All Time</Text>
          <View style={styles.sparkline}>
            <View style={styles.sparklineDot} />
            <View style={styles.sparklineDot} />
            <View style={styles.sparklineDot} />
          </View>
        </View>
      </View>
      
      <View style={styles.quickInsightsCenteredRow}>
        <View style={styles.quickInsightCard}>
          <Target size={20} color={currentTheme.colors.accent} />
          <Text style={styles.quickInsightValue}>{stats.monthlyCompletionRate}%</Text>
          <Text style={styles.quickInsightLabel}>30-Day Rate</Text>
          <View style={styles.sparkline}>
            <View style={styles.sparklineDot} />
            <View style={styles.sparklineDot} />
            <View style={styles.sparklineDot} />
          </View>
        </View>
      </View>
    </View>
  );

  const renderTopHabitCard = () => (
    <View style={styles.topHabitContainer}>
      <Text style={styles.sectionTitle}>🏆 Top Performing Habit</Text>
      <View style={styles.enhancedTopHabitCard}>
        <View style={styles.topHabitHeader}>
          <Text style={styles.topHabitTitle}>{topHabit?.title || 'No habits yet'}</Text>
          <View style={styles.streakBadge}>
            <Flame size={16} color={currentTheme.colors.warning} />
            <Text style={styles.streakBadgeText}>{topHabit?.streak || 0}</Text>
          </View>
        </View>
        <Text style={styles.topHabitStreak}>{topHabit?.streak || 0} day streak</Text>
        {(topHabit?.streak || 0) > 7 && (
          <View style={styles.celebrationBadge}>
            <Sparkles size={14} color={currentTheme.colors.primary} />
            <Text style={styles.celebrationText}>👏 Keep it up!</Text>
          </View>
        )}
        <View style={styles.progressRing}>
          <View style={[
            styles.progressFill,
            { 
              width: `${Math.min(((topHabit?.streak || 0) / 30) * 100, 100)}%`,
              backgroundColor: currentTheme.colors.success
            }
          ]} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={currentTheme.isDark ? 'light' : 'dark'} />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Animated.View style={{
            transform: [{
              scale: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1]
              })
            }]
          }}>
            <BarChart3 size={24} color={currentTheme.colors.primary} style={styles.titleIcon} />
          </Animated.View>
          <Text style={styles.title}>{t('stats.title')}</Text>
        </View>
        <Text style={styles.subtitle}>{t('stats.subtitle')}</Text>
        <Text style={styles.motivationalMessage}>{getMotivationalMessage()}</Text>
        {renderTimeFilter()}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Stats Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>📊 {t('stats.summary.title')}</Text>
          <View style={styles.statsGrid}>
            {renderEnhancedStatCard(
              <Target size={24} color={currentTheme.colors.primary} />,
              stats.totalHabits,
              t('stats.summary.totalHabits'),
              currentTheme.colors.primary,
              'default'
            )}
            {renderEnhancedStatCard(
              <Award size={24} color={currentTheme.colors.success} />,
              stats.currentStreak,
              t('stats.summary.currentStreak'),
              currentTheme.colors.success,
              'fire'
            )}
            {renderEnhancedStatCard(
              <TrendingUp size={24} color={currentTheme.colors.accent} />,
              stats.longestStreak,
              t('stats.summary.longestStreak'),
              currentTheme.colors.accent,
              'trophy'
            )}
            {renderEnhancedStatCard(
              <Calendar size={24} color={currentTheme.colors.primary} />,
              stats.weeklyCompletionRate,
              t('stats.summary.completionRate'),
              currentTheme.colors.primary,
              'progress'
            )}
          </View>
        </View>

        {/* Enhanced Insight Tabs */}
        {renderInsightTabs()}

        {/* Tab Content */}
        {selectedInsightTab === 'overview' && (
          <>
            {/* Enhanced Quick Stats - using real data */}
            <View style={styles.quickInsightsContainer}>
              <View style={styles.quickInsightsRow}>
                <View style={styles.quickInsightCard}>
                  <Zap size={20} color={currentTheme.colors.primary} />
                  <Text style={styles.quickInsightValue}>{stats.totalCompletedToday}</Text>
                  <Text style={styles.quickInsightLabel}>{t('stats.quickStats.today')}</Text>
                  <View style={styles.sparkline}>
                    <View style={styles.sparklineDot} />
                    <View style={styles.sparklineDot} />
                    <View style={styles.sparklineDot} />
                  </View>
                </View>
                
                <View style={styles.quickInsightCard}>
                  <Star size={20} color={currentTheme.colors.success} />
                  <Text style={styles.quickInsightValue}>{stats.totalCompletedAllTime}</Text>
                  <Text style={styles.quickInsightLabel}>{t('stats.quickStats.allTime')}</Text>
                  <View style={styles.sparkline}>
                    <View style={styles.sparklineDot} />
                    <View style={styles.sparklineDot} />
                    <View style={styles.sparklineDot} />
                  </View>
                </View>
              </View>
              
              <View style={styles.quickInsightsCenteredRow}>
                <View style={styles.quickInsightCard}>
                  <Target size={20} color={currentTheme.colors.accent} />
                  <Text style={styles.quickInsightValue}>{stats.monthlyCompletionRate}%</Text>
                  <Text style={styles.quickInsightLabel}>{t('stats.quickStats.thirtyDayRate')}</Text>
                  <View style={styles.sparkline}>
                    <View style={styles.sparklineDot} />
                    <View style={styles.sparklineDot} />
                    <View style={styles.sparklineDot} />
                  </View>
                </View>
              </View>
            </View>
            
            {/* Enhanced Top Performing Habit - using real data */}
            <View style={styles.topHabitContainer}>
              <Text style={styles.sectionTitle}>🏆 {t('stats.topHabit.title')}</Text>
              <View style={styles.enhancedTopHabitCard}>
                <View style={styles.topHabitHeader}>
                  <Text style={styles.topHabitTitle}>
                    {topHabit ? `${topHabit.icon || '📋'} ${topHabit.title}` : t('stats.topHabit.noHabits')}
                  </Text>
                  <View style={styles.streakBadge}>
                    <Flame size={16} color={currentTheme.colors.warning} />
                    <Text style={styles.streakBadgeText}>{topHabit?.streak || 0}</Text>
                  </View>
                </View>
                <Text style={styles.topHabitStreak}>{t('stats.topHabit.dayStreak', { count: topHabit?.streak || 0 })}</Text>
                {(topHabit?.streak || 0) > 7 && (
                  <View style={styles.celebrationBadge}>
                    <Sparkles size={14} color={currentTheme.colors.primary} />
                    <Text style={styles.celebrationText}>👏 {t('stats.topHabit.keepItUp')}</Text>
                  </View>
                )}
                <View style={styles.progressRing}>
                  <View style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min(((topHabit?.streak || 0) / 30) * 100, 100)}%`,
                      backgroundColor: currentTheme.colors.success
                    }
                  ]} />
                </View>
              </View>
            </View>
          </>
        )}

        {selectedInsightTab === 'charts' && (
          <>
            {/* Modern Analytics Dashboard */}
            <View style={styles.analyticsContainer}>
              <View style={styles.analyticsHeader}>
                <View>
                  <Text style={styles.sectionTitle}>📈 {t('stats.charts.title')}</Text>
                  <Text style={styles.analyticsSubtitle}>{t('stats.charts.subtitle')}</Text>
                </View>
              </View>

              {/* Performance Metrics Grid - using real data */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <Flame size={20} color={currentTheme.colors.warning} />
                  </View>
                  <Text style={styles.metricValue}>{stats.currentStreak}</Text>
                  <Text style={styles.metricLabel}>{t('stats.metrics.currentStreak')}</Text>
                  <View style={styles.metricProgress}>
                    <View style={[
                      styles.metricProgressFill, 
                      { 
                        width: `${Math.min((stats.currentStreak / 30) * 100, 100)}%`, 
                        backgroundColor: currentTheme.colors.warning 
                      }
                    ]} />
                  </View>
                </View>
                
                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <Trophy size={20} color={currentTheme.colors.success} />
                  </View>
                  <Text style={styles.metricValue}>{stats.weeklyCompletionRate}%</Text>
                  <Text style={styles.metricLabel}>{t('stats.metrics.successRate')}</Text>
                  <View style={styles.metricProgress}>
                    <View style={[
                      styles.metricProgressFill, 
                      { 
                        width: `${stats.weeklyCompletionRate}%`, 
                        backgroundColor: currentTheme.colors.success 
                      }
                    ]} />
                  </View>
                </View>
                
                <View style={styles.metricCard}>
                  <View style={styles.metricIcon}>
                    <Calendar size={20} color={currentTheme.colors.primary} />
                  </View>
                  <Text style={styles.metricValue}>{stats.totalCompletedToday}</Text>
                  <Text style={styles.metricLabel}>{t('stats.metrics.today')}</Text>
                  <View style={styles.metricProgress}>
                    <View style={[
                      styles.metricProgressFill, 
                      { 
                        width: `${stats.totalHabits > 0 ? (stats.totalCompletedToday / stats.totalHabits) * 100 : 0}%`, 
                        backgroundColor: currentTheme.colors.primary 
                      }
                    ]} />
                  </View>
                </View>
              </View>

              {/* Habit Performance Leaderboard - using real data */}
              <View style={styles.leaderboardContainer}>
                <Text style={styles.leaderboardTitle}>🏆 {t('stats.leaderboard.title')}</Text>
                {habitPerformanceData.length > 0 ? habitPerformanceData.map((item, index) => (
                  <View key={index} style={styles.leaderboardItem}>
                    <View style={styles.leaderboardRank}>
                      <Text style={styles.rankNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.leaderboardInfo}>
                      <Text style={styles.leaderboardHabit}>{item.habit}</Text>
                      <View style={[styles.leaderboardScore, { flexDirection: 'row', alignItems: 'center' }]}>
                        <Text style={styles.scoreText}>{item.score}% {t('stats.leaderboard.completion')}</Text>
                        <View style={[styles.trendIcon, { backgroundColor: `${item.color}20` }]}>
                          {item.trend === 'up' && <TrendingUp size={12} color={item.color} />}
                          {item.trend === 'down' && <Activity size={12} color={item.color} />}
                          {item.trend === 'stable' && <Target size={12} color={item.color} />}
                        </View>
                      </View>
                      <View style={styles.leaderboardBar}>
                        <View style={[styles.leaderboardBarFill, { width: `${item.score}%`, backgroundColor: item.color }]} />
                      </View>
                    </View>
                  </View>
                )) : (
                  <Text style={styles.emptyText}>{t('stats.leaderboard.noHabitsDisplay')}</Text>
                )}
              </View>

              {/* Weekly Heatmap - using real data */}
              <View style={styles.weeklyHeatmap}>
                <Text style={styles.heatmapTitle}>📅 {t('stats.heatmap.weeklyTitle')}</Text>
                <View style={styles.heatmapGrid}>
                  {weeklyActivityData.map((dayData, index) => (
                    <View key={dayData.day} style={styles.heatmapColumn}>
                      <Text style={styles.heatmapDay}>{dayData.day}</Text>
                      {dayData.activities.map((activity, activityIndex) => (
                        <View 
                          key={activityIndex} 
                          style={[
                            styles.heatmapCell,
                            { 
                              backgroundColor: activity.intensity > 0 
                                ? `${currentTheme.colors.primary}${Math.floor(activity.intensity * 9) + 1}0`
                                : currentTheme.colors.surface,
                              opacity: activity.intensity > 0 ? 0.3 + (activity.intensity * 0.7) : 0.3
                            }
                          ]} 
                        />
                      ))}
                    </View>
                  ))}
                </View>
                <View style={styles.heatmapLegend}>
                  <Text style={styles.legendText}>{t('stats.heatmap.less')}</Text>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <View 
                      key={level} 
                      style={[
                        styles.legendSquare, 
                        { backgroundColor: `${currentTheme.colors.primary}${level * 2}0` }
                      ]} 
                    />
                  ))}
                  <Text style={styles.legendText}>{t('stats.heatmap.more')}</Text>
                </View>
              </View>
            </View>
            <MiniProgressCharts />
          </>
        )}

        {selectedInsightTab === 'activity' && (
          <View style={styles.activityContainer}>
            <View style={styles.activityHeader}>
              <Text style={styles.sectionTitle}>📋 {t('stats.activity.title')}</Text>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={handleActivityFilter}
              >
                <Filter size={14} color={currentTheme.colors.primary} />
                <Text style={styles.exportText}>{t('stats.activity.filter')}</Text>
              </TouchableOpacity>
            </View>
            <ActivityLog/>
          </View>
        )}

        {selectedInsightTab === 'advanced' && isDataLoaded && (
          <AdvancedAnalyticsDashboard 
            moodData={moodData}
            habitMoodData={habitMoodData}
          />
        )}

        {/* Enhanced Calendar View - Now with Habit Heatmap */}
        <View style={styles.heatmapContainer}>
          <View style={styles.heatmapHeader}>
            <Text style={styles.sectionTitle}>🔥 {t('stats.habitHeatmap.title')}</Text>
            <Text style={styles.heatmapSubtitle}>{t('stats.habitHeatmap.subtitle')}</Text>
          </View>
          <HabitHeatmap 
            data={generateHeatmapData(habits || [])}
            onDayPress={(date, count) => {
              // Handle day press - could show tooltip or details
              console.log(`Date: ${date}, Habits completed: ${count}`);
            }}
          />
          <View style={styles.heatmapStats}>
            <View style={styles.heatmapStat}>
              <Text style={styles.heatmapStatValue}>{getTotalHabitsThisYear(habits || [])}</Text>
              <Text style={styles.heatmapStatLabel}>{t('stats.habitHeatmap.thisYear')}</Text>
            </View>
            <View style={styles.heatmapStat}>
              <Text style={styles.heatmapStatValue}>{getLongestStreakThisYear(habits || [])}</Text>
              <Text style={styles.heatmapStatLabel}>{t('stats.habitHeatmap.longestStreak')}</Text>
            </View>
            <View style={styles.heatmapStat}>
              <Text style={styles.heatmapStatValue}>{getCurrentStreak(habits || [])}</Text>
              <Text style={styles.heatmapStatLabel}>{t('stats.habitHeatmap.currentStreak')}</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Individual Habit Breakdown */}
        <View style={styles.habitsContainer}>
          <View style={styles.habitsHeader}>
            <Text style={styles.sectionTitle}>📋 {t('stats.habits.title')}</Text>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={handleExportData}
            >
              <Download size={14} color={currentTheme.colors.primary} />
              <Text style={styles.exportText}>{t('stats.habits.export')}</Text>
            </TouchableOpacity>
          </View>
          <HabitStats habits={habits || []} />
        </View>

        {/* Enhanced Social Features */}
        <View style={styles.socialContainer}>
          <View style={styles.socialHeader}>
            <Text style={styles.sectionTitle}>🤝 {t('stats.social.title')}</Text>
          </View>
          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleShareProgress}
            >
              <Share2 size={16} color={currentTheme.colors.primary} />
              <Text style={styles.socialButtonText}>{t('stats.social.share')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleInviteFriends}
            >
              <Users size={16} color={currentTheme.colors.primary} />
              <Text style={styles.socialButtonText}>{t('stats.social.invite')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ShareProgress Modal */}
      <ShareProgress 
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </SafeAreaView>
  );
}

// Helper functions moved to the end
const generateHeatmapData = (habits: any[]) => {
  const data = [];
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  
  // Generate data for each day of the year
  for (let d = new Date(startOfYear); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const completionsOnDay = habits.filter(h => h.completedDates.includes(dateStr)).length;
    
    data.push({
      date: dateStr,
      count: completionsOnDay,
      level: Math.min(Math.floor(completionsOnDay / 2), 4) // 0-4 intensity levels
    });
  }
  
  return data;
};

const getTotalHabitsThisYear = (habits: any[]) => {
  const currentYear = new Date().getFullYear();
  return habits.filter(habit => {
    const createdYear = new Date(habit.createdAt).getFullYear();
    return createdYear === currentYear;
  }).length;
};

const getLongestStreakThisYear = (habits: any[]) => {
  const currentYear = new Date().getFullYear();
  let longestStreak = 0;
  
  habits.forEach(habit => {
    // Filter completions for current year
    const thisYearCompletions = habit.completedDates.filter((date: string) => {
      return new Date(date).getFullYear() === currentYear;
    }).sort();
    
    // Calculate longest streak for this year
    let currentStreak = 0;
    let maxStreak = 0;
    let previousDate: Date | null = null;
    
    thisYearCompletions.forEach((dateStr: string) => {
      const currentDate = new Date(dateStr);
      
      if (previousDate && 
          currentDate.getTime() - previousDate.getTime() === 24 * 60 * 60 * 1000) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
      previousDate = currentDate;
    });
    
    longestStreak = Math.max(longestStreak, maxStreak);
  });
  
  return longestStreak;
};

const getCurrentStreak = (habits: any[]) => {
  return Math.max(...habits.map(h => h.streak), 0);
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 30
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  motivationalMessage: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.primary,
    fontWeight: '600',
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
  enhancedStatCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  fireGlow: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  progressRing: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  dropdownContainer: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dropdownChevron: {
    transform: [{ rotate: '0deg' }],
  },
  dropdownChevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  dropdownItemSelected: {
    backgroundColor: `${colors.primary}08`,
  },
  dropdownItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownItemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  dropdownItemLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownItemDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  quickInsightsContainer: {
    marginBottom: 24,
  },
  quickInsightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickInsightsCenteredRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quickInsightCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickInsightValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  quickInsightLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sparkline: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 2,
  },
  sparklineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  topHabitContainer: {
    marginBottom: 24,
  },
  enhancedTopHabitCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topHabitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topHabitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  topHabitStreak: {
    fontSize: 14,
    color: colors.success,
    marginBottom: 8,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  celebrationText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  insightCardsContainer: {
    marginBottom: 24,
  },
  analyticsContainer: {
    marginBottom: 24,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  analyticsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  metricProgress: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  leaderboardContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  leaderboardTitle: {
       fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  trendIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  leaderboardBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  leaderboardBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  leaderboardRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
  },
  leaderboardHabit: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  leaderboardScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  leaderboardTrend: {
    marginLeft: 4,
  },
  weeklyHeatmap: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heatmapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  heatmapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heatmapColumn: {
    alignItems: 'center',
    gap: 4,
  },
  heatmapDay: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  heatmapCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.surface,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  habitsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  habitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 8,
  },
  exportText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialHeader: {
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  heatmapContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heatmapHeader: {
    marginBottom: 16,
  },
  heatmapSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  heatmapStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heatmapStat: {
    alignItems: 'center',
  },
  heatmapStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  heatmapStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});