import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Dimensions, Alert, Share, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BarChart2, LineChart, TrendingUp, Calendar, Clock, Target, Award, Activity, 
  BarChart3, PieChart, Filter, Flame, Trophy, Zap, Star, ChevronDown,
  Download, Share2, Users, Sparkles, Heart, Smile, Brain, Crown, BookOpen
} from 'lucide-react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { MoodEntry, HabitMoodEntry } from '@/types';
import ProgressChart from '@/components/ProgressChart';
import HabitStats from '@/components/HabitStats';
import ActivityLog from '@/components/ActivityLog';
import MiniProgressCharts from '@/components/MiniProgressCharts';
import ShareProgress from '@/components/ShareProgress';
import InviteFriends from '@/components/InviteFriends';
import HabitHeatmap from '@/components/HabitHeatmap';
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard';
import EnhancedCoachingDashboard from '@/components/EnhancedCoachingDashboard';
import PatternInsights from '@/components/PatternInsights';
import PredictiveAnalyticsService from '@/services/PredictiveAnalyticsService';
import { WellnessIntegrationService } from '@/services/WellnessIntegrationService';
import LibraryAnalyticsService from '@/services/LibraryAnalyticsService';
import LibraryAnalyticsDisplay from '@/components/LibraryAnalyticsDisplay';
import MoodHabitDashboard from '@/components/MoodHabitDashboard';
import SleepTrackingForm from '@/components/SleepTrackingForm';
import ExerciseTrackingForm from '@/components/ExerciseTrackingForm';
import NutritionTrackingForm from '@/components/NutritionTrackingForm';
import MeditationTrackingForm from '@/components/MeditationTrackingForm';
import SocialActivityTrackingForm from '@/components/SocialActivityTrackingForm';


type AnalyticsTab = 'overview' | 'mood' | 'wellness' | 'advanced' | 'library';

export default function StatsScreen() {
  const { habits, getCompletionRate, getDailyCompletionData, getTotalCompletions, getOverallCompletionRate } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const { 
    canAccessAnalytics, 
    canAccessTimeframe, 
    canExportData, 
    canUseWellnessIntegration, 
    canUsePerformanceAlerts, 
    canUsePatternInsights,
    canUseMoodHabitCorrelations,
    showUpgradePrompt 
  } = useSubscription();

  const [selectedAnalyticsTab, setSelectedAnalyticsTab] = useState<AnalyticsTab>('overview');
  const [selectedInsightTab, setSelectedInsightTab] = useState<'overview' | 'charts' | 'activity' | 'advanced'>('overview');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<'all' | 'completed' | 'missed'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [moodData, setMoodData] = useState<MoodEntry[]>([]);
  const [habitMoodData, setHabitMoodData] = useState<HabitMoodEntry[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Wellness data state
  const [wellnessData, setWellnessData] = useState<any>(null);
  const [wellnessAnalysis, setWellnessAnalysis] = useState<any>(null);
  const [wellnessLoading, setWellnessLoading] = useState(false);
  


  // Wellness form state
  const [showWellnessPopup, setShowWellnessPopup] = useState(false);
  const [selectedWellnessCategory, setSelectedWellnessCategory] = useState<string | null>(null);
  const [showWellnessForm, setShowWellnessForm] = useState(false);
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

  // Load wellness data and analysis
  useEffect(() => {
    const loadWellnessData = async () => {
      if (selectedAnalyticsTab === 'wellness') {
        setWellnessLoading(true);
        try {
          // Load all wellness data
          const [sleepData, exerciseData, nutritionData, meditationData, socialData] = await Promise.all([
            WellnessIntegrationService.getSleepData(),
            WellnessIntegrationService.getExerciseData(),
            WellnessIntegrationService.getNutritionData(),
            WellnessIntegrationService.getMeditationData(),
            WellnessIntegrationService.getSocialActivityData()
          ]);

          setWellnessData({
            sleep: sleepData,
            exercise: exerciseData,
            nutrition: nutritionData,
            meditation: meditationData,
            social: socialData
          });

          // Perform comprehensive wellness analysis
          const analysis = await WellnessIntegrationService.performComprehensiveWellnessAnalysis('30d');
          setWellnessAnalysis(analysis);
        } catch (error) {
          console.error('Error loading wellness data:', error);
          setWellnessData(null);
          setWellnessAnalysis(null);
        } finally {
          setWellnessLoading(false);
        }
      }
    };

    loadWellnessData();
  }, [selectedAnalyticsTab]);

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
    
    const days = [t('weeklyActivity.days.mon'), t('weeklyActivity.days.tue'), t('weeklyActivity.days.wed'), t('weeklyActivity.days.thu'), t('weeklyActivity.days.fri'), t('weeklyActivity.days.sat'), t('weeklyActivity.days.sun')];
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
    if (!canExportData()) {
      showUpgradePrompt('data_export');
      return;
    }

    try {
      const habitsData = habits || [];
      const moodEntries = moodData || [];
      const habitMoodEntries = habitMoodData || [];
      
      // Create comprehensive data export
      const exportData = {
        habits: habitsData,
        moodEntries: moodEntries,
        habitMoodEntries: habitMoodEntries,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0'
      };
      
      const csvContent = generateCSVContent(exportData);
      await shareData(csvContent, 'habit-tracker-data.csv');
      
      Alert.alert(t('stats.exportSuccess'), t('stats.exportSuccessMessage'));
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(t('stats.exportError'), t('stats.exportErrorMessage'));
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

  



  // Wellness popup and form handlers
  const handleAddWellness = () => {
    setShowWellnessPopup(true);
  };

  const handleSelectWellnessCategory = (category: string) => {
    setSelectedWellnessCategory(category);
    setShowWellnessPopup(false);
    setShowWellnessForm(true);
  };

  const handleCloseWellnessForm = () => {
    setShowWellnessForm(false);
    setSelectedWellnessCategory(null);
  };

  const handleSaveWellnessData = () => {
    // This will be handled by the individual form components
    handleCloseWellnessForm();
  };

  // Calculate real wellness metrics
  const calculateWellnessMetrics = () => {
    if (!wellnessData || !wellnessAnalysis) {
      return {
        overallScore: 0,
        weeklyTrend: 0,
        sleep: { score: 0, trend: 0, avgHours: 0 },
        exercise: { score: 0, trend: 0, avgSteps: 0 },
        nutrition: { score: 0, trend: 0, avgWater: 0 },
        meditation: { score: 0, trend: 0, avgDuration: 0 },
        social: { score: 0, trend: 0, avgSatisfaction: 0 }
      };
    }

    const analysis = wellnessAnalysis;
    const data = wellnessData;

    // Calculate overall wellness score
    const overallScore = analysis.wellnessScore?.overall || 0;
    
    // Calculate weekly trend (simplified)
    const weeklyTrend = analysis.wellnessScore?.trend === 'improving' ? 3 : 
                       analysis.wellnessScore?.trend === 'declining' ? -2 : 0;

    // Calculate sleep metrics
    const sleepData = data.sleep || [];
    const avgSleepHours = sleepData.length > 0 
      ? sleepData.reduce((sum: number, entry: any) => sum + entry.duration, 0) / sleepData.length 
      : 0;
    const sleepScore = analysis.wellnessScore?.breakdown?.sleep || 0;

    // Calculate exercise metrics
    const exerciseData = data.exercise || [];
    const avgExerciseDuration = exerciseData.length > 0 
      ? exerciseData.reduce((sum: number, entry: any) => sum + entry.duration, 0) / exerciseData.length 
      : 0;
    const exerciseScore = analysis.wellnessScore?.breakdown?.exercise || 0;

    // Calculate nutrition metrics
    const nutritionData = data.nutrition || [];
    const avgWaterIntake = nutritionData.length > 0 
      ? nutritionData.reduce((sum: number, entry: any) => sum + entry.waterIntake, 0) / nutritionData.length 
      : 0;
    const nutritionScore = analysis.wellnessScore?.breakdown?.nutrition || 0;

    // Calculate meditation metrics
    const meditationData = data.meditation || [];
    const avgMeditationDuration = meditationData.length > 0 
      ? meditationData.reduce((sum: number, entry: any) => sum + entry.duration, 0) / meditationData.length 
      : 0;
    const meditationScore = analysis.wellnessScore?.breakdown?.meditation || 0;

    // Calculate social metrics
    const socialData = data.social || [];
    const avgSocialSatisfaction = socialData.length > 0 
      ? socialData.reduce((sum: number, entry: any) => sum + entry.satisfaction, 0) / socialData.length 
      : 0;
    const socialScore = analysis.wellnessScore?.breakdown?.social || 0;

    return {
      overallScore: Math.round(overallScore),
      weeklyTrend,
      sleep: { 
        score: Math.round(sleepScore), 
        trend: sleepScore > 80 ? 0.3 : sleepScore > 60 ? 0 : -0.2,
        avgHours: Math.round(avgSleepHours * 10) / 10
      },
      exercise: { 
        score: Math.round(exerciseScore), 
        trend: exerciseScore > 80 ? 0.5 : exerciseScore > 60 ? 0 : -0.3,
        avgSteps: Math.round(avgExerciseDuration * 100) // Convert minutes to approximate steps
      },
      nutrition: { 
        score: Math.round(nutritionScore), 
        trend: nutritionScore > 80 ? 0.2 : nutritionScore > 60 ? 0 : -0.1,
        avgWater: Math.round(avgWaterIntake)
      },
      meditation: { 
        score: Math.round(meditationScore), 
        trend: meditationScore > 80 ? 0.4 : meditationScore > 60 ? 0 : -0.2,
        avgDuration: Math.round(avgMeditationDuration)
      },
      social: { 
        score: Math.round(socialScore), 
        trend: socialScore > 80 ? 0.3 : socialScore > 60 ? 0 : -0.2,
        avgSatisfaction: Math.round(avgSocialSatisfaction * 20) / 20
      }
    };
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

  const renderAnalyticsSubtabs = () => {
    const tabs = [
      {
        key: 'overview',
        icon: BarChart3,
        color: currentTheme.colors.primary
      },
      {
        key: 'mood',
        icon: Heart,
        color: currentTheme.colors.warning
      },
      {
        key: 'wellness',
        icon: Activity,
        color: currentTheme.colors.success
      },
      {
        key: 'advanced',
        icon: Sparkles,
        color: currentTheme.colors.accent
      },
      {
        key: 'library',
        icon: BookOpen,
        color: currentTheme.colors.accent
      }
    ];

    return (
      <View style={styles.analyticsTabsContainer}>
        <View style={styles.analyticsTabs}>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = selectedAnalyticsTab === tab.key;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.analyticsTab,
                  isActive && styles.activeAnalyticsTab,
                  { borderColor: isActive ? tab.color : 'transparent' }
                ]}
                onPress={() => handleAnalyticsTabChange(tab.key as AnalyticsTab)}
              >
                <View style={[
                  styles.analyticsTabIcon,
                  { backgroundColor: isActive ? `${tab.color}15` : `${currentTheme.colors.textMuted}10` }
                ]}>
                  <IconComponent 
                    size={24} 
                    color={isActive ? tab.color : currentTheme.colors.textMuted} 
                  />
                </View>
                {isActive && (
                  <View style={[styles.analyticsTabIndicator, { backgroundColor: tab.color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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
  );

  const renderTopHabitCard = () => (
    <View style={styles.topHabitContainer}>
      <Text style={styles.sectionTitle}>🏆 {t('stats.topHabit.title')}</Text>
      <View style={styles.enhancedTopHabitCard}>
        <View style={styles.topHabitHeader}>
          <Text style={styles.topHabitTitle}>{topHabit?.title || t('stats.topHabit.noHabits')}</Text>
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
  );



  const renderAnalyticsContent = () => {
    switch (selectedAnalyticsTab) {
      case 'overview':
        return (
          <>
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

            {/* Enhanced Quick Stats */}
            {renderQuickInsightCards()}
            
            {/* Enhanced Top Performing Habit */}
            {renderTopHabitCard()}

            {/* Charts Section */}
            <View style={styles.analyticsContainer}>
              <View style={styles.analyticsHeader}>
                <View>
                  <Text style={styles.sectionTitle}>📈 {t('stats.charts.title')}</Text>
                  <Text style={styles.analyticsSubtitle}>{t('stats.charts.subtitle')}</Text>
                </View>
              </View>

              {/* Performance Metrics Grid */}
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

              {/* Habit Performance Leaderboard */}
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

              {/* Weekly Heatmap */}
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
                   // console.log(`Date: ${date}, Habits completed: ${count}`);
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

            {/* Advanced Analytics Dashboard - Only show for Pro users */}
            {canAccessAnalytics(365) ? (
              <View style={styles.advancedAnalyticsContainer}>
                <View style={styles.advancedAnalyticsHeader}>
                  <Text style={styles.sectionTitle}>🤖 {t('stats.advanced.title')}</Text>
                  <Text style={styles.sectionSubtitle}>{t('stats.advanced.subtitle')}</Text>
                </View>
                {isDataLoaded ? (
                  <AdvancedAnalyticsDashboard 
                    moodData={moodData}
                    habitMoodData={habitMoodData}
                  />
                ) : (
                  <Text style={styles.loadingText}>{t('stats.loading')}</Text>
                )}
              </View>
            ) : (
              <View style={styles.upgradeContainer}>
                <Text style={styles.sectionTitle}>🤖 {t('stats.advanced.title')}</Text>
                <Text style={styles.sectionSubtitle}>{t('stats.advanced.subtitle')}</Text>
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => showUpgradePrompt('analytics_limit')}
                >
                  <Text style={styles.upgradeButtonText}>{t('premium.upgradeToPro')}</Text>
                </TouchableOpacity>
              </View>
            )}
           </>
         );

      case 'mood':
        return (
          <View style={styles.moodContainer}>
            <Text style={styles.sectionTitle}>😊 {t('stats.mood.title')}</Text>
            <Text style={styles.sectionSubtitle}>{t('stats.mood.subtitle')}</Text>
            {canUseMoodHabitCorrelations() ? (
              <MoodHabitDashboard />
            ) : (
              <View style={styles.upgradeContainer}>
                <Text style={styles.sectionSubtitle}>{t('stats.mood.upgradeMessage')}</Text>
                <TouchableOpacity 
                  style={styles.upgradeButton}
                  onPress={() => showUpgradePrompt('mood_correlations')}
                >
                  <Text style={styles.upgradeButtonText}>{t('premium.upgradeToPro')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

            case 'wellness':
        return (
          <>
            {!showWellnessForm ? (
              <View style={styles.wellnessContainer}>
                {wellnessLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{t('stats.loading')}</Text>
                  </View>
                ) : (
                  <>
                    {/* Wellness Overview Header */}
                    <View style={styles.wellnessHeader}>
                      <Text style={styles.sectionTitle}>💚 {t('wellness.title')}</Text>
                      <Text style={styles.sectionSubtitle}>{t('wellness.subtitle')}</Text>
                    </View>

                    {/* Wellness Score Overview */}
                    <View style={styles.wellnessScoreContainer}>
                      <View style={styles.wellnessScoreCard}>
                        <View style={styles.wellnessScoreHeader}>
                          <Heart size={28} color={currentTheme.colors.primary} />
                          <Text style={styles.wellnessScoreTitle}>{t('wellness.overview.overallScore')}</Text>
                        </View>
                        <Text style={styles.wellnessScoreValue}>{calculateWellnessMetrics().overallScore}%</Text>
                        <View style={styles.wellnessScoreProgress}>
                          <View style={[styles.wellnessScoreFill, { width: `${calculateWellnessMetrics().overallScore}%`, backgroundColor: currentTheme.colors.primary }]} />
                        </View>
                        <Text style={styles.wellnessScoreTrend}>
                          {calculateWellnessMetrics().weeklyTrend > 0 ? '↗️' : calculateWellnessMetrics().weeklyTrend < 0 ? '↘️' : '→'} 
                          {calculateWellnessMetrics().weeklyTrend > 0 ? ` +${calculateWellnessMetrics().weeklyTrend}%` : 
                           calculateWellnessMetrics().weeklyTrend < 0 ? ` ${calculateWellnessMetrics().weeklyTrend}%` : ' 0%'} {t('stats.thisWeek')}
                        </Text>
                      </View>
                    </View>

                    {/* Wellness Pillars Grid */}
                    <View style={styles.wellnessPillarsContainer}>
                      <Text style={styles.wellnessSectionTitle}>{t('wellness.pillars.title')}</Text>
                      <View style={styles.wellnessPillarsGrid}>
                        <View style={styles.wellnessPillarCard}>
                          <View style={styles.wellnessPillarIcon}>
                            <Activity size={24} color={currentTheme.colors.success} />
                          </View>
                          <Text style={styles.wellnessPillarTitle}>{t('wellness.categories.physical')}</Text>
                          <Text style={styles.wellnessPillarValue}>{calculateWellnessMetrics().exercise.score}%</Text>
                          <View style={styles.wellnessPillarProgress}>
                            <View style={[styles.wellnessPillarFill, { width: `${calculateWellnessMetrics().exercise.score}%`, backgroundColor: currentTheme.colors.success }]} />
                          </View>
                          <Text style={styles.wellnessPillarDesc}>{t('wellness.categories.physicalSubtitle')}</Text>
                        </View>

                        <View style={styles.wellnessPillarCard}>
                          <View style={styles.wellnessPillarIcon}>
                            <Brain size={24} color={currentTheme.colors.accent} />
                          </View>
                          <Text style={styles.wellnessPillarTitle}>{t('wellness.categories.mental')}</Text>
                          <Text style={styles.wellnessPillarValue}>{calculateWellnessMetrics().meditation.score}%</Text>
                          <View style={styles.wellnessPillarProgress}>
                            <View style={[styles.wellnessPillarFill, { width: `${calculateWellnessMetrics().meditation.score}%`, backgroundColor: currentTheme.colors.accent }]} />
                          </View>
                          <Text style={styles.wellnessPillarDesc}>{t('wellness.categories.mentalSubtitle')}</Text>
                        </View>

                        <View style={styles.wellnessPillarCard}>
                          <View style={styles.wellnessPillarIcon}>
                            <Users size={24} color={currentTheme.colors.warning} />
                          </View>
                          <Text style={styles.wellnessPillarTitle}>{t('wellness.categories.social')}</Text>
                          <Text style={styles.wellnessPillarValue}>{calculateWellnessMetrics().social.score}%</Text>
                          <View style={styles.wellnessPillarProgress}>
                            <View style={[styles.wellnessPillarFill, { width: `${calculateWellnessMetrics().social.score}%`, backgroundColor: currentTheme.colors.warning }]} />
                          </View>
                          <Text style={styles.wellnessPillarDesc}>{t('wellness.categories.socialSubtitle')}</Text>
                        </View>

                        <View style={styles.wellnessPillarCard}>
                          <View style={styles.wellnessPillarIcon}>
                            <Target size={24} color={currentTheme.colors.primary} />
                          </View>
                          <Text style={styles.wellnessPillarTitle}>{t('wellness.categories.spiritual')}</Text>
                          <Text style={styles.wellnessPillarValue}>{calculateWellnessMetrics().sleep.score}%</Text>
                          <View style={styles.wellnessPillarProgress}>
                            <View style={[styles.wellnessPillarFill, { width: `${calculateWellnessMetrics().sleep.score}%`, backgroundColor: currentTheme.colors.primary }]} />
                          </View>
                          <Text style={styles.wellnessPillarDesc}>{t('wellness.categories.spiritualSubtitle')}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Wellness Metrics */}
                    <View style={styles.wellnessMetricsContainer}>
                      <Text style={styles.wellnessSectionTitle}>{t('wellness.metrics.title')}</Text>
                      <View style={styles.wellnessMetricsGrid}>
                        <View style={styles.wellnessMetricCard}>
                          <View style={styles.wellnessMetricIcon}>
                            <Clock size={20} color={currentTheme.colors.success} />
                          </View>
                          <Text style={styles.wellnessMetricValue}>{calculateWellnessMetrics().sleep.avgHours}h</Text>
                          <Text style={styles.wellnessMetricLabel}>{t('stats.wellness.metrics.avgSleep')}</Text>
                          <Text style={styles.wellnessMetricTrend}>
                            {calculateWellnessMetrics().sleep.trend > 0 ? '↗️' : calculateWellnessMetrics().sleep.trend < 0 ? '↘️' : '→'} 
                            {calculateWellnessMetrics().sleep.trend > 0 ? ` +${calculateWellnessMetrics().sleep.trend}h` : 
                             calculateWellnessMetrics().sleep.trend < 0 ? ` ${calculateWellnessMetrics().sleep.trend}h` : ' 0h'}
                          </Text>
                        </View>

                        <View style={styles.wellnessMetricCard}>
                          <View style={styles.wellnessMetricIcon}>
                            <Activity size={20} color={currentTheme.colors.primary} />
                          </View>
                          <Text style={styles.wellnessMetricValue}>{calculateWellnessMetrics().exercise.avgSteps}k</Text>
                          <Text style={styles.wellnessMetricLabel}>{t('stats.wellness.metrics.dailySteps')}</Text>
                          <Text style={styles.wellnessMetricTrend}>
                            {calculateWellnessMetrics().exercise.trend > 0 ? '↗️' : calculateWellnessMetrics().exercise.trend < 0 ? '↘️' : '→'} 
                            {calculateWellnessMetrics().exercise.trend > 0 ? ` +${calculateWellnessMetrics().exercise.trend}k` : 
                             calculateWellnessMetrics().exercise.trend < 0 ? ` ${calculateWellnessMetrics().exercise.trend}k` : ' 0k'}
                          </Text>
                        </View>

                        <View style={styles.wellnessMetricCard}>
                          <View style={styles.wellnessMetricIcon}>
                            <Zap size={20} color={currentTheme.colors.warning} />
                          </View>
                          <Text style={styles.wellnessMetricValue}>{calculateWellnessMetrics().meditation.avgDuration}m</Text>
                          <Text style={styles.wellnessMetricLabel}>{t('stats.wellness.metrics.meditation')}</Text>
                          <Text style={styles.wellnessMetricTrend}>
                            {calculateWellnessMetrics().meditation.trend > 0 ? '↗️' : calculateWellnessMetrics().meditation.trend < 0 ? '↘️' : '→'} 
                            {calculateWellnessMetrics().meditation.trend > 0 ? ` +${calculateWellnessMetrics().meditation.trend}m` : 
                             calculateWellnessMetrics().meditation.trend < 0 ? ` ${calculateWellnessMetrics().meditation.trend}m` : ' 0m'}
                          </Text>
                        </View>

                        <View style={styles.wellnessMetricCard}>
                          <View style={styles.wellnessMetricIcon}>
                            <Users size={20} color={currentTheme.colors.accent} />
                          </View>
                          <Text style={styles.wellnessMetricValue}>{calculateWellnessMetrics().nutrition.avgWater}</Text>
                          <Text style={styles.wellnessMetricLabel}>{t('stats.wellness.metrics.waterGlasses')}</Text>
                          <Text style={styles.wellnessMetricTrend}>
                            {calculateWellnessMetrics().nutrition.trend > 0 ? '↗️' : calculateWellnessMetrics().nutrition.trend < 0 ? '↘️' : '→'} 
                            {calculateWellnessMetrics().nutrition.trend > 0 ? ` +${calculateWellnessMetrics().nutrition.trend}` : 
                             calculateWellnessMetrics().nutrition.trend < 0 ? ` ${calculateWellnessMetrics().nutrition.trend}` : ' 0'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Wellness Add Button */}
                    <View style={styles.wellnessAddContainer}>
                                          <Text style={styles.wellnessSectionTitle}>{t('stats.wellness.trackYourWellness')}</Text>
                    <Text style={styles.wellnessAddSubtitle}>{t('stats.wellness.addWellnessSubtitle')}</Text>
                      
                      <TouchableOpacity style={styles.wellnessAddButton} onPress={handleAddWellness}>
                        <View style={styles.wellnessAddButtonContent}>
                          <Text style={styles.wellnessAddButtonIcon}>+</Text>
                          <Text style={styles.wellnessAddButtonText}>{t('stats.wellness.addWellnessActivity')}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Wellness Recommendations */}
                    <View style={styles.wellnessRecommendationsContainer}>
                      <Text style={styles.wellnessSectionTitle}>{t('stats.recommendations.title')}</Text>
                      <View style={styles.wellnessRecommendationsList}>
                        <TouchableOpacity style={styles.wellnessRecommendationCard}>
                          <View style={styles.wellnessRecommendationIcon}>
                            <Activity size={20} color={currentTheme.colors.success} />
                          </View>
                          <View style={styles.wellnessRecommendationContent}>
                            <Text style={styles.wellnessRecommendationTitle}>{t('stats.wellness.recommendations.increaseMovement')}</Text>
                            <Text style={styles.wellnessRecommendationDesc}>{t('stats.wellness.recommendations.increaseMovementDesc')}</Text>
                          </View>
                          <ChevronDown size={16} color={currentTheme.colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.wellnessRecommendationCard}>
                          <View style={styles.wellnessRecommendationIcon}>
                            <Clock size={20} color={currentTheme.colors.primary} />
                          </View>
                          <View style={styles.wellnessRecommendationContent}>
                            <Text style={styles.wellnessRecommendationTitle}>{t('stats.wellness.recommendations.optimizeSleep')}</Text>
                            <Text style={styles.wellnessRecommendationDesc}>{t('stats.wellness.recommendations.optimizeSleepDesc')}</Text>
                          </View>
                          <ChevronDown size={16} color={currentTheme.colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.wellnessRecommendationCard}>
                          <View style={styles.wellnessRecommendationIcon}>
                            <Brain size={20} color={currentTheme.colors.accent} />
                          </View>
                          <View style={styles.wellnessRecommendationContent}>
                            <Text style={styles.wellnessRecommendationTitle}>{t('stats.wellness.recommendations.deepBreathing')}</Text>
                            <Text style={styles.wellnessRecommendationDesc}>{t('stats.wellness.recommendations.deepBreathingDesc')}</Text>
                          </View>
                          <ChevronDown size={16} color={currentTheme.colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.wellnessFormSection}>
                <View style={styles.wellnessFormHeader}>
                  <TouchableOpacity style={styles.wellnessFormBackButton} onPress={handleCloseWellnessForm}>
                    <Text style={styles.wellnessFormBackIcon}>←</Text>
                    <Text style={styles.wellnessFormBackText}>{t('stats.wellness.backToWellness')}</Text>
                  </TouchableOpacity>
                </View>
                
                {selectedWellnessCategory === 'sleep' && (
                  <SleepTrackingForm 
                    onSave={handleCloseWellnessForm}
                    onCancel={handleCloseWellnessForm}
                  />
                )}

                {selectedWellnessCategory === 'exercise' && (
                  <ExerciseTrackingForm 
                    onSave={handleCloseWellnessForm}
                    onCancel={handleCloseWellnessForm}
                  />
                )}

                {selectedWellnessCategory === 'nutrition' && (
                  <NutritionTrackingForm 
                    onSave={handleCloseWellnessForm}
                    onCancel={handleCloseWellnessForm}
                  />
                )}

                {selectedWellnessCategory === 'meditation' && (
                  <MeditationTrackingForm 
                    onSave={handleCloseWellnessForm}
                    onCancel={handleCloseWellnessForm}
                  />
                )}

                {selectedWellnessCategory === 'social' && (
                  <SocialActivityTrackingForm 
                    onSave={handleCloseWellnessForm}
                    onCancel={handleCloseWellnessForm}
                  />
                )}
              </View>
            )}
          </>
        );





      case 'advanced':
        return (
          <View style={styles.aiCoachingContainer}>
            <View style={styles.aiCoachingHeader}>
              <View style={styles.aiCoachingTitleContainer}>
                <Text style={styles.sectionTitle}>🤖 {t('stats.aiCoaching.title')}</Text>
                <View style={styles.betaTag}>
                  <Text style={styles.betaText}>BETA</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>{t('stats.aiCoaching.subtitle')}</Text>
            </View>
            
            {isDataLoaded ? (
              <EnhancedCoachingDashboard 
                moodData={moodData}
                habitMoodData={habitMoodData}
              />
            ) : (
              <View style={styles.aiCoachingCard}>
                <View style={styles.aiCoachingIcon}>
                  <Sparkles size={32} color={currentTheme.colors.primary} />
                </View>
                <Text style={styles.aiCoachingTitle}>{t('stats.aiCoaching.loading')}</Text>
                <Text style={styles.aiCoachingDescription}>
                  {t('stats.aiCoaching.preparingSession')}
                </Text>
              </View>
            )}
          </View>
        );

      case 'library':
        return (
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticsHeader}>
              <Text style={styles.sectionTitle}>
                📚 {t('stats.library.title')}{'\n'}
                <Text style={styles.sectionSubtitle}>{t('stats.library.subtitle')}</Text>
              </Text>
            </View>
            
            <LibraryAnalyticsDisplay />
          </View>
        );

      default:
        return null;
    }
  };

  const handleAnalyticsTabChange = (tab: AnalyticsTab) => {
    // Check if user can access advanced analytics
    if (tab === 'wellness' && !canUseWellnessIntegration()) {
      showUpgradePrompt('wellness_integration');
      return;
    }
    
    if (tab === 'advanced' && !canUsePerformanceAlerts()) {
      showUpgradePrompt('analytics_limit');
      return;
    }
    
    setSelectedAnalyticsTab(tab);
  };

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
        {renderAnalyticsSubtabs()}
      </View>



      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Render content based on selected tab */}
        {renderAnalyticsContent()}
      </ScrollView>

      {/* ShareProgress Modal */}
      <ShareProgress 
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      {/* Wellness Category Selection Popup */}
      {showWellnessPopup && (
        <View style={styles.modalOverlay}>
          <View style={styles.wellnessPopup}>
            <View style={styles.wellnessPopupHeader}>
              <Text style={styles.wellnessPopupTitle}>{t('stats.wellness.selectCategory')}</Text>
              <TouchableOpacity onPress={() => setShowWellnessPopup(false)}>
                <Text style={styles.wellnessPopupClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.wellnessPopupContent}>
              {[
                { key: 'sleep', icon: '😴', title: t('stats.wellness.categories.sleep.title'), desc: t('stats.wellness.categories.sleep.desc') },
                { key: 'exercise', icon: '🏃‍♂️', title: t('stats.wellness.categories.exercise.title'), desc: t('stats.wellness.categories.exercise.desc') },
                { key: 'nutrition', icon: '🥗', title: t('stats.wellness.categories.nutrition.title'), desc: t('stats.wellness.categories.nutrition.desc') },
                { key: 'meditation', icon: '🧘‍♀️', title: t('stats.wellness.categories.meditation.title'), desc: t('stats.wellness.categories.meditation.desc') },
                { key: 'social', icon: '👥', title: t('stats.wellness.categories.social.title'), desc: t('stats.wellness.categories.social.desc') }
              ].map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={styles.wellnessPopupOption}
                  onPress={() => handleSelectWellnessCategory(category.key)}
                >
                  <Text style={styles.wellnessPopupIcon}>{category.icon}</Text>
                  <View style={styles.wellnessPopupOptionContent}>
                    <Text style={styles.wellnessPopupOptionTitle}>{category.title}</Text>
                    <Text style={styles.wellnessPopupOptionDesc}>{category.desc}</Text>
                  </View>
                  <Text style={styles.wellnessPopupArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}


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
    lineHeight: 24,
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
  advancedAnalyticsContainer: {
    marginBottom: 24,
  },
  advancedAnalyticsHeader: {
    marginBottom: 16,
  },
  aiCoachingContainer: {
    marginBottom: 24,
  },
  aiCoachingHeader: {
    marginBottom: 24,
  },
  aiCoachingTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  betaTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  betaText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  aiCoachingCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  aiCoachingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  aiCoachingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  aiCoachingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  aiCoachingButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  aiCoachingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
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

  moodContainer: {
    marginBottom: 24,
  },
  wellnessContainer: {
    marginBottom: 24,
  },
  wellnessHeader: {
    marginBottom: 24,
  },
  wellnessScoreContainer: {
    marginBottom: 24,
  },
  wellnessScoreCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  wellnessScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  wellnessScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  wellnessScoreValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 12,
  },
  wellnessScoreProgress: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  wellnessScoreFill: {
    height: '100%',
    borderRadius: 4,
  },
  wellnessScoreTrend: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  wellnessSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  wellnessPillarsContainer: {
    marginBottom: 24,
  },
  wellnessPillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  wellnessPillarCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wellnessPillarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  wellnessPillarTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  wellnessPillarValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  wellnessPillarProgress: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  wellnessPillarFill: {
    height: '100%',
    borderRadius: 2,
  },
  wellnessPillarDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  wellnessMetricsContainer: {
    marginBottom: 24,
  },
  wellnessMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  wellnessMetricCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wellnessMetricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  wellnessMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  wellnessMetricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  wellnessMetricTrend: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '500',
  },
  wellnessInsightsContainer: {
    marginBottom: 24,
  },
  wellnessInsightsList: {
    gap: 12,
  },
  wellnessInsightCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wellnessInsightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wellnessInsightContent: {
    flex: 1,
  },
  wellnessInsightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  wellnessInsightDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  wellnessRecommendationsContainer: {
    marginBottom: 24,
  },
  wellnessRecommendationsList: {
    gap: 12,
  },
  wellnessRecommendationCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wellnessRecommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wellnessRecommendationContent: {
    flex: 1,
  },
  wellnessRecommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  wellnessRecommendationDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  wellnessAddContainer: {
    marginBottom: 24,
  },
  wellnessAddSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  wellnessAddButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wellnessAddButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellnessAddButtonIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.background,
    marginRight: 12,
  },
  wellnessAddButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  wellnessFormSection: {
    flex: 1,
    backgroundColor: colors.background,
  },
  wellnessFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  wellnessFormBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  wellnessFormBackIcon: {
    fontSize: 18,
    color: colors.primary,
    marginRight: 8,
    fontWeight: 'bold',
  },
  wellnessFormBackText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  wellnessPopup: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  wellnessPopupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  wellnessPopupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  wellnessPopupClose: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
  wellnessPopupContent: {
    gap: 12,
  },
  wellnessPopupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wellnessPopupIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  wellnessPopupOptionContent: {
    flex: 1,
  },
  wellnessPopupOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  wellnessPopupOptionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  wellnessPopupArrow: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: 'bold',
  },

  wellnessFormCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  wellnessFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  wellnessFormContent: {
    gap: 16,
  },
  wellnessFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wellnessFormLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  wellnessFormInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
  },
  wellnessFormValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
  wellnessFormUnit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  wellnessFormOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wellnessFormOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  wellnessFormOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  wellnessFormOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  wellnessFormOptionTextActive: {
    color: colors.background,
  },
  wellnessQualityStars: {
    flexDirection: 'row',
    gap: 4,
  },
  wellnessStar: {
    padding: 2,
  },
  wellnessStarText: {
    fontSize: 16,
    opacity: 0.3,
  },
  wellnessStarActive: {
    opacity: 1,
  },
  wellnessStressLevel: {
    flexDirection: 'row',
    gap: 8,
  },
  wellnessStressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  wellnessStressDotLow: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  wellnessStressText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  wellnessFormButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  wellnessFormButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  analyticsTabsContainer: {
    marginBottom: 24,
  },
  analyticsTabsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  analyticsTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  analyticsTab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  activeAnalyticsTab: {
    backgroundColor: colors.background,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  analyticsTabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  analyticsTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  activeAnalyticsTabText: {
    color: colors.primary,
  },
  analyticsTabDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  activeAnalyticsTabDescription: {
    color: colors.textMuted,
  },
  analyticsTabIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    width: 20,
    height: 3,
    borderRadius: 2,
    transform: [{ translateX: -10 }],
  },
  upgradeContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});