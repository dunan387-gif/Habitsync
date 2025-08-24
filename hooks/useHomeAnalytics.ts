import { useMemo } from 'react';
import { useHabits } from '@/context/HabitContext';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useLanguage } from '@/context/LanguageContext';

export interface HomeAnalytics {
  todayCompletions: number;
  totalHabits: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  nextHabitRecommendation: string;
  streakContext: string;
  appliedKnowledge: string[];
  motivation: string;
  priorityHabits: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
}

export function useHomeAnalytics(): HomeAnalytics {
  const { habits } = useHabits();
  const { state } = useCrossTabInsights();
  const { t } = useLanguage();

  return useMemo(() => {
    // Handle null habits
    if (!habits) {
      return {
        todayCompletions: 0,
        totalHabits: 0,
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        nextHabitRecommendation: t('analytics.insights.noHabitsLeft'),
        streakContext: t('analytics.insights.startFirstHabit'),
        appliedKnowledge: [],
        motivation: t('analytics.insights.everyJourneyStarts'),
        priorityHabits: [],
      };
    }

    const todayCompletions = habits.filter(h => h.completedToday).length;
    const totalHabits = habits.length;
    const completionRate = totalHabits > 0 ? (todayCompletions / totalHabits) * 100 : 0;
    
    // Calculate streaks
    const currentStreak = habits.reduce((max, habit) => 
      Math.max(max, habit.currentStreak || 0), 0);
    const longestStreak = habits.reduce((max, habit) => 
      Math.max(max, habit.bestStreak || 0), 0);

    // Generate next habit recommendation
    const incompleteHabits = habits.filter(h => !h.completedToday);
    const nextHabitRecommendation = incompleteHabits.length > 0 
      ? incompleteHabits[0]?.title || t('analytics.insights.noHabitsLeft')
      : t('analytics.insights.allHabitsCompleted');

    // Generate streak context
    const streakContext = generateStreakContext(currentStreak, longestStreak, t);

    // Get applied knowledge from library
    const appliedKnowledge = state.data.library.appliedTechniques || [];

    // Generate motivation based on completion rate
    const motivation = generateMotivation(completionRate, todayCompletions, totalHabits, t);

    // Identify priority habits
    const priorityHabits = identifyPriorityHabits(habits, t);

    return {
      todayCompletions,
      totalHabits,
      completionRate,
      currentStreak,
      longestStreak,
      nextHabitRecommendation,
      streakContext,
      appliedKnowledge,
      motivation,
      priorityHabits,
    };
  }, [habits, state.data.library.appliedTechniques, t]);
}

function generateStreakContext(currentStreak: number, longestStreak: number, t: any): string {
  if (currentStreak === 0) {
    return t('analytics.insights.startFirstHabit');
  }
  
  if (currentStreak === longestStreak) {
    return t('analytics.insights.newRecordStreak', { streak: currentStreak });
  }
  
  if (currentStreak >= longestStreak * 0.8) {
    return t('analytics.insights.closeToRecord', { 
      current: currentStreak, 
      record: longestStreak 
    });
  }
  
  return t('analytics.insights.maintainStreak', { streak: currentStreak });
}

function generateMotivation(completionRate: number, completions: number, total: number, t: any): string {
  if (completions === 0) {
    return t('analytics.insights.everyJourneyStarts');
  }
  
  if (completionRate >= 80) {
    return t('analytics.insights.excellentWork');
  }
  
  if (completionRate >= 60) {
    return t('analytics.insights.greatProgress');
  }
  
  if (completionRate >= 40) {
    return t('analytics.insights.youreMakingProgress');
  }
  
  return t('analytics.insights.roomForImprovement');
}

function identifyPriorityHabits(habits: any[], t: any) {
  return habits
    .filter(habit => !habit.completedToday)
    .map(habit => {
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let reason = '';

      // High priority: habits with long streaks or high importance
      if (habit.currentStreak > 7 || habit.importance === 'high') {
        priority = 'high';
        reason = habit.currentStreak > 7 
          ? t('analytics.priority.highStreak', { streak: habit.currentStreak })
          : t('analytics.priority.highImportance');
      }
      // Low priority: habits with no streak or low importance
      else if (habit.currentStreak === 0 || habit.importance === 'low') {
        priority = 'low';
        reason = habit.currentStreak === 0 
          ? t('analytics.priority.newHabit')
          : t('analytics.priority.lowImportance');
      }

      return {
        id: habit.id,
        title: habit.title,
        priority,
        reason,
      };
    })
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })
    .slice(0, 3); // Return top 3 priority habits
}
