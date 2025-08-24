import { useMemo } from 'react';
import { useHabits } from '@/context/HabitContext';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useLanguage } from '@/context/LanguageContext';

export interface SettingsAnalytics {
  preferredTime: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  notificationStyle: 'gentle' | 'motivational' | 'strict';
  personalizationScore: number;
  optimizationRecommendations: Array<{
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    priority: number;
  }>;
  userPreferences: {
    theme: string;
    language: string;
    timezone: string;
    privacyLevel: 'public' | 'private' | 'friends';
  };
  habitAlignment: {
    alignedHabits: number;
    totalHabits: number;
    alignmentScore: number;
    misalignedHabits: Array<{
      id: string;
      title: string;
      reason: string;
      suggestion: string;
    }>;
  };
  performanceInsights: {
    bestTimeForHabits: string;
    mostProductiveDay: string;
    optimalHabitCount: number;
    recommendedBreakTime: number;
  };
}

export function useSettingsAnalytics(): SettingsAnalytics {
  const { habits } = useHabits();
  const { state } = useCrossTabInsights();
  const { t } = useLanguage();

  return useMemo(() => {
    const settingsData = state.data.settings;
    const preferredTime = settingsData.preferredTime || 'morning';
    const difficultyLevel = settingsData.difficultyLevel || 'beginner';
    const focusAreas = settingsData.focusAreas || ['productivity'];
    const notificationStyle = settingsData.notificationStyle || 'motivational';
    
    // Handle null habits
    if (!habits) {
      return {
        preferredTime,
        difficultyLevel,
        focusAreas,
        notificationStyle,
        personalizationScore: 0,
        optimizationRecommendations: [],
        userPreferences: getUserPreferences(settingsData),
        habitAlignment: {
          alignedHabits: 0,
          totalHabits: 0,
          alignmentScore: 0,
          misalignedHabits: [],
        },
        performanceInsights: {
          bestTimeForHabits: preferredTime,
          mostProductiveDay: 'Monday',
          optimalHabitCount: getOptimalHabitCount(difficultyLevel),
          recommendedBreakTime: 15,
        },
      };
    }
    
    // Calculate personalization score
    const personalizationScore = calculatePersonalizationScore(settingsData, habits);
    
    // Generate optimization recommendations
    const optimizationRecommendations = generateOptimizationRecommendations(settingsData, habits, t);
    
    // Get user preferences
    const userPreferences = getUserPreferences(settingsData);
    
    // Analyze habit alignment
    const habitAlignment = analyzeHabitAlignment(habits, settingsData, t);
    
    // Generate performance insights
    const performanceInsights = generatePerformanceInsights(habits, settingsData, t);

    return {
      preferredTime,
      difficultyLevel,
      focusAreas,
      notificationStyle,
      personalizationScore,
      optimizationRecommendations,
      userPreferences,
      habitAlignment,
      performanceInsights,
    };
  }, [habits, state.data.settings, t]);
}

function calculatePersonalizationScore(settingsData: any, habits: any[]): number {
  let score = 0;
  
  // Time preference alignment
  if (settingsData.preferredTime) score += 20;
  
  // Difficulty level appropriateness
  const avgHabitDifficulty = habits.reduce((sum, habit) => sum + (habit.difficulty || 1), 0) / Math.max(habits.length, 1);
  const difficultyMatch = Math.abs(avgHabitDifficulty - getDifficultyLevel(settingsData.difficultyLevel));
  score += Math.max(0, 20 - difficultyMatch * 10);
  
  // Focus areas alignment
  if (settingsData.focusAreas && settingsData.focusAreas.length > 0) score += 20;
  
  // Notification style preference
  if (settingsData.notificationStyle) score += 20;
  
  // Habit count optimization
  const optimalHabitCount = getOptimalHabitCount(settingsData.difficultyLevel);
  const habitCountScore = Math.max(0, 20 - Math.abs(habits.length - optimalHabitCount) * 2);
  score += habitCountScore;
  
  return Math.min(score, 100);
}

function generateOptimizationRecommendations(settingsData: any, habits: any[], t: any) {
  const recommendations: Array<{
    category: string;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    priority: number;
  }> = [];
  
  // Habit count optimization
  const optimalCount = getOptimalHabitCount(settingsData.difficultyLevel);
  if (habits.length > optimalCount + 2) {
    recommendations.push({
      category: 'habit-count',
      title: t('analytics.settings.reduceHabitCount'),
      description: t('analytics.settings.reduceHabitCountDesc', { current: habits.length, optimal: optimalCount }),
      impact: 'high',
      priority: 1,
    });
  } else if (habits.length < optimalCount - 2) {
    recommendations.push({
      category: 'habit-count',
      title: t('analytics.settings.increaseHabitCount'),
      description: t('analytics.settings.increaseHabitCountDesc', { current: habits.length, optimal: optimalCount }),
      impact: 'medium',
      priority: 2,
    });
  }
  
  // Time optimization
  if (settingsData.preferredTime === 'evening' && habits.some(h => h.category === 'productivity')) {
    recommendations.push({
      category: 'timing',
      title: t('analytics.settings.morningProductivity'),
      description: t('analytics.settings.morningProductivityDesc'),
      impact: 'medium',
      priority: 3,
    });
  }
  
  // Difficulty adjustment
  const avgDifficulty = habits.reduce((sum, h) => sum + (h.difficulty || 1), 0) / Math.max(habits.length, 1);
  const userLevel = getDifficultyLevel(settingsData.difficultyLevel);
  
  if (avgDifficulty > userLevel + 1) {
    recommendations.push({
      category: 'difficulty',
      title: t('analytics.settings.reduceDifficulty'),
      description: t('analytics.settings.reduceDifficultyDesc'),
      impact: 'high',
      priority: 1,
    });
  } else if (avgDifficulty < userLevel - 1) {
    recommendations.push({
      category: 'difficulty',
      title: t('analytics.settings.increaseDifficulty'),
      description: t('analytics.settings.increaseDifficultyDesc'),
      impact: 'medium',
      priority: 3,
    });
  }
  
  // Focus area alignment
  const habitCategories = [...new Set(habits.map(h => h.category).filter(Boolean))];
  const unalignedCategories = habitCategories.filter(cat => 
    !settingsData.focusAreas?.includes(cat)
  );
  
  if (unalignedCategories.length > 0) {
    recommendations.push({
      category: 'focus',
      title: t('analytics.settings.alignFocusAreas'),
      description: t('analytics.settings.alignFocusAreasDesc', { areas: unalignedCategories.join(', ') }),
      impact: 'medium',
      priority: 2,
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.impact] - priorityOrder[a.impact];
    if (priorityDiff !== 0) return priorityDiff;
    return a.priority - b.priority;
  });
}

function getUserPreferences(settingsData: any) {
  return {
    theme: settingsData.theme || 'light',
    language: settingsData.language || 'en',
    timezone: settingsData.timezone || 'UTC',
    privacyLevel: settingsData.privacyLevel || 'private',
  };
}

function analyzeHabitAlignment(habits: any[], settingsData: any, t: any) {
  const alignedHabits = habits.filter(habit => {
    // Check if habit aligns with focus areas
    if (settingsData.focusAreas && settingsData.focusAreas.length > 0) {
      return settingsData.focusAreas.includes(habit.category);
    }
    return true;
  }).length;
  
  const totalHabits = habits.length;
  const alignmentScore = totalHabits > 0 ? (alignedHabits / totalHabits) * 100 : 0;
  
  const misalignedHabits = habits.filter(habit => {
    if (!settingsData.focusAreas || settingsData.focusAreas.length === 0) return false;
    return !settingsData.focusAreas.includes(habit.category);
  }).map(habit => ({
    id: habit.id,
    title: habit.title,
    reason: t('analytics.settings.notInFocusArea', { category: habit.category }),
    suggestion: t('analytics.settings.addToFocusArea', { category: habit.category }),
  }));
  
  return {
    alignedHabits,
    totalHabits,
    alignmentScore,
    misalignedHabits,
  };
}

function generatePerformanceInsights(habits: any[], settingsData: any, t: any) {
  // Mock performance data - in real implementation, this would analyze historical data
  const bestTimeForHabits = settingsData.preferredTime || 'morning';
  const mostProductiveDay = 'Monday'; // Mock data
  const optimalHabitCount = getOptimalHabitCount(settingsData.difficultyLevel);
  const recommendedBreakTime = 15; // minutes
  
  return {
    bestTimeForHabits,
    mostProductiveDay,
    optimalHabitCount,
    recommendedBreakTime,
  };
}

function getDifficultyLevel(level: string): number {
  const levels = { beginner: 1, intermediate: 2, advanced: 3 };
  return levels[level as keyof typeof levels] || 1;
}

function getOptimalHabitCount(difficultyLevel: string): number {
  const counts = { beginner: 3, intermediate: 5, advanced: 7 };
  return counts[difficultyLevel as keyof typeof counts] || 3;
}
