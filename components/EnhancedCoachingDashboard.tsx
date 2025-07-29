import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useHabits } from '@/context/HabitContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { EnhancedCoachingService } from '@/services/EnhancedCoachingService';
import { MoodEntry, HabitMoodEntry, Habit } from '@/types';

const { width } = Dimensions.get('window');

interface EnhancedCoachingDashboardProps {
  moodData: MoodEntry[];
  habitMoodData: HabitMoodEntry[];
}

export default function EnhancedCoachingDashboard({ moodData, habitMoodData }: EnhancedCoachingDashboardProps) {
  const { habits } = useHabits();
  const { currentTheme } = useTheme();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'coaching' | 'strategies' | 'resilience' | 'plans'>('coaching');
  const [activeSession, setActiveSession] = useState<'daily_check_in' | 'habit_optimization' | 'mood_coaching' | 'resilience_training' | null>('daily_check_in');
  const [coachingSession, setCoachingSession] = useState<any>(null);
  const [personalizedStrategies, setPersonalizedStrategies] = useState<any[]>([]);
  const [resilienceTraining, setResilienceTraining] = useState<any>(null);
  const [moodOptimizedPlans, setMoodOptimizedPlans] = useState<any[]>([]);
  
  const coachingService = useMemo(() => EnhancedCoachingService.getInstance(), []);
  const styles = createStyles(currentTheme.colors);

  // Load initial data (strategies, resilience, plans)
  useEffect(() => {
    const loadInitialData = async () => {
      if (!habits || habits.length === 0) return;
      
      try {
        const [strategies, resilience, plans] = await Promise.all([
          coachingService.generatePersonalizedStrategies(habits, moodData, habitMoodData),
          coachingService.createEmotionalResilienceProgram('user-id', 'beginner', moodData, []),
          Promise.all(habits.map(habit => 
            coachingService.createMoodOptimizedHabitPlan(habit, moodData, habitMoodData)
          ))
        ]);
        
        setPersonalizedStrategies(strategies);
        setResilienceTraining(resilience);
        setMoodOptimizedPlans(plans);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, [habits, moodData, habitMoodData, coachingService]);

  // Load coaching session data when activeSession changes
  useEffect(() => {
    const loadCoachingSession = async () => {
      if (!habits || habits.length === 0 || !activeSession) return;
      
      try {
        const session = await coachingService.generateCoachingSession('user-id', activeSession, {
          habits,
          moodData,
          habitMoodData
        });
        
        setCoachingSession(session);
      } catch (error) {
        console.error('Error loading coaching session:', error);
      }
    };

    loadCoachingSession();
  }, [activeSession, habits, moodData, habitMoodData, coachingService]);

  const renderTabBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollContainer}>
      <View style={styles.tabContentContainer}>
        {[
          { key: 'coaching', label: '🤖 AI Coach', icon: '🤖' },
          { key: 'strategies', label: '🎯 Strategies', icon: '🎯' },
          { key: 'resilience', label: '💪 Resilience', icon: '💪' },
          { key: 'plans', label: '📋 Plans', icon: '📋' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={[styles.tabIcon, selectedTab === tab.key && styles.activeTabIcon]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label.replace(/^.+ /, '')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return currentTheme.colors.success;
      case 'medium': return currentTheme.colors.warning;
      case 'challenging': return currentTheme.colors.error;
      default: return currentTheme.colors.primary;
    }
  };

  const renderCoachingSession = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🤖 AI Coaching Session</Text>
      
      {/* Session Type Selector */}
      <View style={styles.sessionTypeContainer}>
        {/* First Row */}
        <View style={styles.sessionTypeRow}>
          <TouchableOpacity
            style={[styles.sessionTypeCard, activeSession === 'daily_check_in' && styles.activeSessionTypeCard]}
            onPress={() => setActiveSession('daily_check_in')}
          >
            <Text style={styles.sessionIcon}>☀️</Text>
            <Text style={styles.sessionLabel}>Daily Check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sessionTypeCard, activeSession === 'habit_optimization' && styles.activeSessionTypeCard]}
            onPress={() => setActiveSession('habit_optimization')}
          >
            <Text style={styles.sessionIcon}>⚡</Text>
            <Text style={styles.sessionLabel}>Habit Optimization</Text>
          </TouchableOpacity>
        </View>
        
        {/* Second Row */}
        <View style={styles.sessionTypeRow}>
          <TouchableOpacity
            style={[styles.sessionTypeCard, activeSession === 'mood_coaching' && styles.activeSessionTypeCard]}
            onPress={() => setActiveSession('mood_coaching')}
          >
            <Text style={styles.sessionIcon}>🧠</Text>
            <Text style={styles.sessionLabel}>Mood Coaching</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sessionTypeCard, activeSession === 'resilience_training' && styles.activeSessionTypeCard]}
            onPress={() => setActiveSession('resilience_training')}
          >
            <Text style={styles.sessionIcon}>💪</Text>
            <Text style={styles.sessionLabel}>Resilience Training</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Session Content */}
      {activeSession && (
        <View style={styles.activeSessionContainer}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>{activeSession.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Session</Text>
            <Text style={styles.sessionTime}>5 min session</Text>
          </View>
          
          {/* Coaching Insights */}
          <View style={styles.insightsSection}>
            <Text style={styles.subsectionTitle}>💡 Key Insights</Text>
            {coachingSession?.insights?.map((insight: any, index: number) => (
              <View key={index} style={styles.insightCard}>
                <Text style={styles.insightText}>{insight.description}</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{Math.round(insight.confidence * 100)}% confidence</Text>
                </View>
              </View>
            )) || (
              <View style={styles.insightCard}>
                <Text style={styles.insightText}>
                  Your morning routine completion is 23% higher when you get 7+ hours of sleep
                </Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>92% confidence</Text>
                </View>
              </View>
            )}
          </View>

          {/* Recommendations */}
          <View style={styles.recommendationsSection}>
            <Text style={styles.subsectionTitle}>🎯 Recommendations</Text>
            {coachingSession?.recommendations?.map((rec: any, index: number) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(rec.difficulty) }]}>
                    <Text style={styles.difficultyText}>{rec.difficulty}</Text>
                  </View>
                </View>
                <Text style={styles.recommendationDescription}>{rec.description}</Text>
                <View style={styles.recommendationSteps}>
                  {rec.steps?.map((step: string, stepIndex: number) => (
                    <Text key={stepIndex} style={styles.stepText}>• {step}</Text>
                  ))}
                </View>
              </View>
            )) || (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationTitle}>Optimize Sleep Schedule</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: currentTheme.colors.success }]}>
                    <Text style={styles.difficultyText}>Easy</Text>
                  </View>
                </View>
                <Text style={styles.recommendationDescription}>
                  Set a consistent bedtime 30 minutes earlier to improve morning habit success
                </Text>
                <View style={styles.recommendationSteps}>
                  <Text style={styles.stepText}>• Set phone alarm for bedtime reminder</Text>
                  <Text style={styles.stepText}>• Create evening wind-down routine</Text>
                  <Text style={styles.stepText}>• Track sleep quality for 1 week</Text>
                </View>
              </View>
            )}
          </View>

          {/* Coaching Exercises */}
          <View style={styles.exercisesSection}>
            <Text style={styles.subsectionTitle}>🧘 Coaching Exercises</Text>
            {coachingSession?.exercises?.map((exercise: any, index: number) => (
              <TouchableOpacity key={index} style={styles.exerciseCard}>
                <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                <Text style={styles.exerciseDuration}>{exercise.duration || '3 min'}</Text>
              </TouchableOpacity>
            )) || (
              <TouchableOpacity style={styles.exerciseCard}>
                <Text style={styles.exerciseTitle}>Mindful Habit Reflection</Text>
                <Text style={styles.exerciseDescription}>
                  3-minute guided reflection on your habit patterns
                </Text>
                <Text style={styles.exerciseDuration}>3 min</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  const renderPersonalizedStrategies = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Personalized Strategies</Text>
      
      <View style={styles.strategiesGrid}>
        {personalizedStrategies.length > 0 ? personalizedStrategies.map((strategy, index) => (
          <View key={index} style={styles.strategyCard}>
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyIcon}>🌅</Text>
              <View style={styles.strategyContent}>
                <Text style={styles.strategyTitle}>{strategy.title || 'Morning Momentum Builder'}</Text>
                <Text style={styles.strategyCategory}>{strategy.category || 'Timing Optimization'}</Text>
              </View>
              <View style={[styles.impactBadge, { backgroundColor: currentTheme.colors.primary }]}>
                <Text style={styles.impactText}>High Impact</Text>
              </View>
            </View>
            <Text style={styles.strategyDescription}>
              {strategy.description || 'Start with your easiest habit first to build momentum for the day'}
            </Text>
            <View style={styles.strategyMetrics}>
              <Text style={styles.metricText}>Expected improvement: +{strategy.expectedImprovement || 34}%</Text>
              <Text style={styles.metricText}>Implementation time: {strategy.timeframe || '1 week'}</Text>
            </View>
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply Strategy</Text>
            </TouchableOpacity>
          </View>
        )) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Generating personalized strategies... Complete more habits to unlock custom strategies!</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderResilienceTraining = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💪 Emotional Resilience Training</Text>
      
      {/* Resilience Score */}
      <View style={styles.resilienceScoreCard}>
        <Text style={styles.resilienceScoreLabel}>Current Resilience Score</Text>
        <Text style={styles.resilienceScoreValue}>{resilienceTraining?.currentScore?.toFixed(1) || '7.2'}</Text>
        <Text style={styles.resilienceScoreSubtext}>{resilienceTraining?.level || 'Above Average'}</Text>
        <View style={styles.resilienceProgress}>
          <View style={[styles.resilienceProgressFill, { width: `${(resilienceTraining?.currentScore || 7.2) * 10}%` }]} />
        </View>
      </View>

      {/* Training Modules */}
      <View style={styles.trainingModules}>
        <Text style={styles.subsectionTitle}>Training Modules</Text>
        
        {resilienceTraining?.modules?.map((module: any, index: number) => (
          <TouchableOpacity key={index} style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>{module.icon || '🧠'}</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleProgress}>{module.progress || 'New module'}</Text>
              </View>
              <Text style={styles.moduleTime}>{module.duration || '15 min'}</Text>
            </View>
            <Text style={styles.moduleDescription}>{module.description}</Text>
          </TouchableOpacity>
        )) || [
          <TouchableOpacity key="cognitive" style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>🧠</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>Cognitive Reframing</Text>
                <Text style={styles.moduleProgress}>3/5 exercises completed</Text>
              </View>
              <Text style={styles.moduleTime}>15 min</Text>
            </View>
            <Text style={styles.moduleDescription}>
              Learn to reframe negative thoughts about habit setbacks
            </Text>
          </TouchableOpacity>,
          <TouchableOpacity key="stress" style={styles.moduleCard}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleIcon}>🎯</Text>
              <View style={styles.moduleContent}>
                <Text style={styles.moduleTitle}>Stress Response Management</Text>
                <Text style={styles.moduleProgress}>New module</Text>
              </View>
              <Text style={styles.moduleTime}>20 min</Text>
            </View>
            <Text style={styles.moduleDescription}>
              Develop healthy responses to stress that support your habits
            </Text>
          </TouchableOpacity>
        ]}
      </View>
    </View>
  );

  const renderMoodOptimizedPlans = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Mood-Optimized Habit Plans</Text>
      
      <View style={styles.plansContainer}>
        {moodOptimizedPlans.length > 0 ? moodOptimizedPlans.map((plan, index) => (
          <View key={index} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>{plan.habitTitle || 'Exercise Routine'}</Text>
              <View style={[styles.adaptiveBadge, { backgroundColor: currentTheme.colors.warning }]}>
                <Text style={styles.adaptiveText}>Adaptive</Text>
              </View>
            </View>
            
            {/* Mood-based schedule */}
            <View style={styles.moodSchedule}>
              <Text style={styles.scheduleTitle}>Mood-Based Schedule</Text>
              
              {plan.moodBasedSchedule?.map((schedule: any, scheduleIndex: number) => (
                <View key={scheduleIndex} style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>{schedule.moodState}</Text>
                  <Text style={styles.moodTime}>{schedule.optimalTimes?.[0]} - {schedule.modifications?.[0]}</Text>
                </View>
              )) || [
                <View key="energetic" style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>😊 Energetic</Text>
                  <Text style={styles.moodTime}>7:00 AM - High intensity workout</Text>
                </View>,
                <View key="calm" style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>😌 {t('moodCheckIn.moodTags.calm')}</Text>
                  <Text style={styles.moodTime}>6:00 PM - Yoga or stretching</Text>
                </View>,
                <View key="low" style={styles.moodScheduleItem}>
                  <Text style={styles.moodState}>😔 Low Energy</Text>
                  <Text style={styles.moodTime}>Any time - 10-minute walk</Text>
                </View>
              ]}
            </View>

            {/* Adaptive elements */}
            <View style={styles.adaptiveElements}>
              <Text style={styles.adaptiveTitle}>Adaptive Modifications</Text>
              {plan.adaptiveElements ? [
                ...plan.adaptiveElements.lowMoodAlternatives?.map((alt: string, i: number) => (
                  <Text key={`low-${i}`} style={styles.adaptiveText}>• Low mood: {alt}</Text>
                )),
                ...plan.adaptiveElements.highMoodEnhancements?.map((enh: string, i: number) => (
                  <Text key={`high-${i}`} style={styles.adaptiveText}>• High mood: {enh}</Text>
                )),
                ...plan.adaptiveElements.neutralMoodMaintenance?.map((main: string, i: number) => (
                  <Text key={`neutral-${i}`} style={styles.adaptiveText}>• Neutral: {main}</Text>
                ))
              ] : [
                <Text key="low" style={styles.adaptiveText}>• Low mood: Reduce intensity by 50%</Text>,
                <Text key="high" style={styles.adaptiveText}>• High mood: Add 10 minutes bonus</Text>,
                <Text key="neutral" style={styles.adaptiveText}>• Neutral: Follow standard routine</Text>
              ]}
            </View>
          </View>
        )) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Creating mood-optimized plans... Track your moods to unlock adaptive scheduling!</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'coaching':
        return renderCoachingSession();
      case 'strategies':
        return renderPersonalizedStrategies();
      case 'resilience':
        return renderResilienceTraining();
      case 'plans':
        return renderMoodOptimizedPlans();
      default:
        return renderCoachingSession();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enhanced Coaching</Text>
        <Text style={styles.subtitle}>AI-powered personalized guidance</Text>
        {renderTabBar()}
      </View>
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  tabScrollContainer: {
    marginHorizontal: -20,
  },
  tabContentContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 100,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  activeTabIcon: {
    fontSize: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sessionTypeContainer: {
    marginBottom: 20,
  },
  sessionTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sessionTypeCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeSessionTypeCard: {
    backgroundColor: colors.primary,
  },
  sessionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  activeSessionContainer: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  sessionTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  insightsSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  recommendationsSection: {
    marginBottom: 24,
  },
  recommendationCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
    textTransform: 'capitalize',
  },
  recommendationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  recommendationSteps: {
    gap: 4,
  },
  stepText: {
    fontSize: 14,
    color: colors.text,
  },
  exercisesSection: {
    marginBottom: 24,
  },
  exerciseCard: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  exerciseDuration: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  strategiesGrid: {
    gap: 16,
  },
  strategyCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strategyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  strategyContent: {
    flex: 1,
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  strategyCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  impactText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  strategyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  strategyMetrics: {
    marginBottom: 16,
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: colors.text,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
  resilienceScoreCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  resilienceScoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resilienceScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  resilienceScoreSubtext: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  resilienceProgress: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  resilienceProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  trainingModules: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  moduleProgress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  moduleTime: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  moduleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  adaptiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adaptiveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.background,
  },
  moodSchedule: {
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  moodScheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moodState: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  moodTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  adaptiveElements: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  adaptiveTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptyState: {
    backgroundColor: colors.card,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});