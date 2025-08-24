import { useMemo } from 'react';
import { useHabits } from '@/context/HabitContext';
import { useCrossTabInsights } from '@/context/CrossTabInsightsContext';
import { useLanguage } from '@/context/LanguageContext';

export interface GamificationAnalytics {
  currentLevel: number;
  totalXP: number;
  levelProgress: number;
  recentAchievements: Array<{
    id: string;
    title: string;
    description: string;
    earnedAt: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  nextMilestone: {
    title: string;
    description: string;
    xpRequired: number;
    progress: number;
    estimatedDays: number;
  };
  streakMotivation: string;
  levelBenefits: string[];
  achievementRate: number;
  weeklyProgress: {
    xpGained: number;
    achievementsEarned: number;
    streaksMaintained: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export function useGamificationAnalytics(): GamificationAnalytics {
  const { habits } = useHabits();
  const { state } = useCrossTabInsights();
  const { t } = useLanguage();

  return useMemo(() => {
    const gamificationData = state.data.gamification;
    const currentLevel = gamificationData.currentLevel || 1;
    const totalXP = gamificationData.totalXP || 0;
    
    // Calculate level progress
    const xpForCurrentLevel = (currentLevel - 1) * 1000;
    const xpForNextLevel = currentLevel * 1000;
    const levelProgress = ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;
    
    // Handle null habits
    if (!habits) {
      return {
        currentLevel,
        totalXP,
        levelProgress,
        recentAchievements: [],
        nextMilestone: {
          title: `Level ${currentLevel + 1}`,
          description: t('analytics.gamification.nextLevelDescription'),
          xpRequired: 1000,
          progress: 0,
          estimatedDays: 20,
        },
        streakMotivation: t('analytics.gamification.startStreak'),
        levelBenefits: getLevelBenefits(currentLevel),
        achievementRate: 0,
        weeklyProgress: {
          xpGained: 0,
          achievementsEarned: 0,
          streaksMaintained: 0,
          trend: 'stable' as const,
        },
      };
    }
    
    // Generate recent achievements
    const recentAchievements = generateRecentAchievements(habits, totalXP, currentLevel);
    
    // Calculate next milestone
    const nextMilestone = calculateNextMilestone(totalXP, currentLevel, habits, t);
    
    // Generate streak motivation
    const streakMotivation = generateStreakMotivation(habits, currentLevel, t);
    
    // Get level benefits
    const levelBenefits = getLevelBenefits(currentLevel);
    
    // Calculate achievement rate
    const achievementRate = calculateAchievementRate(recentAchievements, habits);
    
    // Calculate weekly progress
    const weeklyProgress = calculateWeeklyProgress(habits, totalXP, recentAchievements);

    return {
      currentLevel,
      totalXP,
      levelProgress,
      recentAchievements,
      nextMilestone,
      streakMotivation,
      levelBenefits,
      achievementRate,
      weeklyProgress,
    };
  }, [habits, state.data.gamification, t]);
}

function generateRecentAchievements(habits: any[], totalXP: number, currentLevel: number) {
  const achievements: Array<{
    id: string;
    title: string;
    description: string;
    earnedAt: string;
    impact: 'high' | 'medium' | 'low';
  }> = [];
  
  // Level up achievements
  if (currentLevel > 1) {
    achievements.push({
      id: 'level-up',
      title: `Level ${currentLevel} Reached!`,
      description: 'You\'ve leveled up through consistent habit building',
      earnedAt: new Date().toISOString(),
      impact: 'high',
    });
  }
  
  // Streak achievements
  const maxStreak = Math.max(...habits.map(h => h.currentStreak || 0));
  if (maxStreak >= 7) {
    achievements.push({
      id: 'week-streak',
      title: 'Week Warrior',
      description: 'Maintained a 7-day streak',
      earnedAt: new Date().toISOString(),
      impact: 'medium',
    });
  }
  
  if (maxStreak >= 30) {
    achievements.push({
      id: 'month-streak',
      title: 'Monthly Master',
      description: 'Maintained a 30-day streak',
      earnedAt: new Date().toISOString(),
      impact: 'high',
    });
  }
  
  // Completion achievements
  const completedToday = habits.filter(h => h.completedToday).length;
  if (completedToday === habits.length && habits.length > 0) {
    achievements.push({
      id: 'perfect-day',
      title: 'Perfect Day',
      description: 'Completed all habits for the day',
      earnedAt: new Date().toISOString(),
      impact: 'high',
    });
  }
  
  // XP milestones
  if (totalXP >= 1000) {
    achievements.push({
      id: 'xp-milestone',
      title: 'XP Pioneer',
      description: 'Earned 1000 XP',
      earnedAt: new Date().toISOString(),
      impact: 'medium',
    });
  }
  
  return achievements.slice(-3); // Return last 3 achievements
}

function calculateNextMilestone(totalXP: number, currentLevel: number, habits: any[], t: any) {
  const nextLevelXP = currentLevel * 1000;
  const xpNeeded = nextLevelXP - totalXP;
  const progress = ((totalXP - ((currentLevel - 1) * 1000)) / 1000) * 100;
  
  // Estimate days based on average daily XP
  const averageDailyXP = Math.max(50, totalXP / Math.max(1, currentLevel * 7));
  const estimatedDays = Math.ceil(xpNeeded / averageDailyXP);
  
  return {
    title: `Level ${currentLevel + 1}`,
    description: t('analytics.gamification.nextLevelDescription'),
    xpRequired: xpNeeded,
    progress,
    estimatedDays,
  };
}

function generateStreakMotivation(habits: any[], currentLevel: number, t: any): string {
  const maxStreak = Math.max(...habits.map(h => h.currentStreak || 0));
  
  if (maxStreak === 0) {
    return t('analytics.gamification.startStreak');
  }
  
  if (maxStreak >= 30) {
    return t('analytics.gamification.excellentStreak', { streak: maxStreak });
  }
  
  if (maxStreak >= 7) {
    return t('analytics.gamification.goodStreak', { streak: maxStreak });
  }
  
  return t('analytics.gamification.buildStreak', { streak: maxStreak });
}

function getLevelBenefits(currentLevel: number): string[] {
  const benefits: { [key: number]: string[] } = {
    1: ['Basic habit tracking', 'Daily insights'],
    2: ['Advanced analytics', 'Weekly reports'],
    3: ['Custom insights', 'Priority recommendations'],
    4: ['Cross-tab integration', 'Learning correlations'],
    5: ['AI-powered insights', 'Predictive analytics'],
  };
  
  return benefits[currentLevel] || benefits[1];
}

function calculateAchievementRate(recentAchievements: any[], habits: any[]): number {
  if (habits.length === 0) return 0;
  
  const totalPossibleAchievements = habits.length * 2; // Rough estimate
  const earnedAchievements = recentAchievements.length;
  
  return Math.min((earnedAchievements / totalPossibleAchievements) * 100, 100);
}

function calculateWeeklyProgress(habits: any[], totalXP: number, recentAchievements: any[]) {
  // Mock weekly data - in real implementation, this would come from historical data
  const xpGained = Math.floor(Math.random() * 200) + 50;
  const achievementsEarned = recentAchievements.length;
  const streaksMaintained = habits.filter(h => h.currentStreak > 0).length;
  
  // Determine trend based on recent activity
  const trend: 'improving' | 'stable' | 'declining' = xpGained > 100 ? 'improving' : xpGained > 50 ? 'stable' : 'declining';
  
  return {
    xpGained,
    achievementsEarned,
    streaksMaintained,
    trend,
  };
}
