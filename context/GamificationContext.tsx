import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, UserLevel, MoodEntry, StreakMilestone, GamificationData, Habit } from '@/types';
// Remove this line:
// import { useHabits } from './HabitContext';
import { useCelebration } from './CelebrationContext';

// Add this helper function at the top
function getLocalDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

interface GamificationContextType {
  gamificationData: GamificationData | null;
  addXP: (amount: number, source: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  addMoodEntry: (mood: number, note?: string, tags?: string[]) => Promise<void>;
  checkAchievements: (habits: Habit[]) => Promise<void>; // Add habits parameter
  getAvailableAchievements: () => Achievement[];
  getTodaysMoodEntry: () => MoodEntry | null;
  canCheckMoodToday: () => boolean;
  getXPForAction: (action: string) => number;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const INITIAL_GAMIFICATION_DATA: GamificationData = {
  userLevel: {
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    title: 'Habit Beginner',
    perks: ['Daily habit tracking']
  },
  achievements: [],
  unlockedAchievements: [],
  streakMilestones: [],
  moodEntries: [],
  dailyXPEarned: 0
};

const XP_REWARDS = {
  habit_completion: 10,
  streak_milestone: 25,
  mood_checkin: 5,
  perfect_day: 50,
  weekly_goal: 100
};

const LEVEL_TITLES = [
  'Habit Beginner', 'Routine Builder', 'Consistency Seeker', 'Habit Enthusiast',
  'Routine Master', 'Habit Champion', 'Lifestyle Architect', 'Habit Legend'
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_habit',
    title: '🌱 First Steps',
    description: 'Complete your first habit',
    icon: '🌱',
    category: 'milestone',
    requirement: { type: 'total_completions', value: 1 },
    xpReward: 25,
    rarity: 'common'
  },
  {
    id: 'week_warrior',
    title: '⚡ Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    xpReward: 100,
    rarity: 'rare'
  },
  {
    id: 'month_master',
    title: '🏆 Month Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    xpReward: 500,
    rarity: 'epic'
  },
  {
    id: 'century_club',
    title: '💎 Century Club',
    description: 'Maintain a 100-day streak',
    icon: '💎',
    category: 'streak',
    requirement: { type: 'streak', value: 100 },
    xpReward: 1000,
    rarity: 'legendary'
  },
  {
    id: 'mood_tracker',
    title: '😊 Mood Tracker',
    description: 'Check in your mood for 7 consecutive days',
    icon: '😊',
    category: 'consistency',
    requirement: { type: 'consecutive_days', value: 7 },
    xpReward: 75,
    rarity: 'common'
  },
  {
    id: 'habit_collector',
    title: '📚 Habit Collector',
    description: 'Create 10 different habits',
    icon: '📚',
    category: 'milestone',
    requirement: { type: 'habit_count', value: 10 },
    xpReward: 200,
    rarity: 'rare'
  },
  {
    id: 'perfect_week',
    title: '⭐ Perfect Week',
    description: 'Complete all habits for 7 consecutive days',
    icon: '⭐',
    category: 'completion',
    requirement: { type: 'perfect_week', value: 7 },
    xpReward: 300,
    rarity: 'epic'
  }
];

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  // Remove this line:
  // const { habits } = useHabits();
  const { showCelebration } = useCelebration();

  useEffect(() => {
    loadGamificationData();
  }, []);

  useEffect(() => {
    if (gamificationData) {
      saveGamificationData();
    }
  }, [gamificationData]);

  const loadGamificationData = async () => {
    try {
      const stored = await AsyncStorage.getItem('gamificationData');
      if (stored) {
        const data = JSON.parse(stored);
        setGamificationData({ ...INITIAL_GAMIFICATION_DATA, ...data, achievements: ACHIEVEMENTS });
      } else {
        setGamificationData({ ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS });
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
      setGamificationData({ ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS });
    }
  };

  const saveGamificationData = async () => {
    if (!gamificationData) return;
    try {
      await AsyncStorage.setItem('gamificationData', JSON.stringify(gamificationData));
    } catch (error) {
      console.error('Failed to save gamification data:', error);
    }
  };

  const calculateXPToNextLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  const addXP = async (amount: number, source: string) => {
    if (!gamificationData) return;

    const newTotalXP = gamificationData.userLevel.totalXP + amount;
    const newCurrentXP = gamificationData.userLevel.currentXP + amount;
    let newLevel = gamificationData.userLevel.level;
    let xpToNextLevel = gamificationData.userLevel.xpToNextLevel;

    // Check for level up
    while (newCurrentXP >= xpToNextLevel) {
      newLevel++;
      const remainingXP = newCurrentXP - xpToNextLevel;
      xpToNextLevel = calculateXPToNextLevel(newLevel);
      
      // Show level up celebration
      showCelebration('level_up', `🎉 Level Up! You're now level ${newLevel}!`);
    }

    const updatedData = {
      ...gamificationData,
      userLevel: {
        level: newLevel,
        currentXP: newCurrentXP >= xpToNextLevel ? newCurrentXP - xpToNextLevel : newCurrentXP,
        xpToNextLevel,
        totalXP: newTotalXP,
        title: LEVEL_TITLES[Math.min(newLevel - 1, LEVEL_TITLES.length - 1)],
        perks: getLevelPerks(newLevel)
      },
      dailyXPEarned: gamificationData.dailyXPEarned + amount
    };

    setGamificationData(updatedData);
  };

  const getLevelPerks = (level: number): string[] => {
    const perks = ['Daily habit tracking'];
    if (level >= 3) perks.push('Advanced statistics');
    if (level >= 5) perks.push('Custom themes');
    if (level >= 10) perks.push('AI habit suggestions');
    if (level >= 15) perks.push('Premium features');
    return perks;
  };

  const unlockAchievement = async (achievementId: string) => {
    if (!gamificationData || gamificationData.unlockedAchievements.includes(achievementId)) return;

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;

    const updatedData = {
      ...gamificationData,
      unlockedAchievements: [...gamificationData.unlockedAchievements, achievementId]
    };

    setGamificationData(updatedData);
    await addXP(achievement.xpReward, `achievement_${achievementId}`);
    
    showCelebration('achievement', `🏆 Achievement Unlocked: ${achievement.title}!`);
  };

  const addMoodEntry = async (mood: number, note?: string, tags?: string[]) => {
    if (!gamificationData) return;
  
    const today = getLocalDateString();
    const existingEntry = gamificationData.moodEntries.find(entry => entry.date === today);
    
    if (existingEntry) {
      console.log('Mood already recorded for today.');
      throw new Error('Mood already recorded for today');
    }
  
    const newEntry: MoodEntry = {
      id: `mood_${Date.now()}`,
      date: today,
      mood: mood as 1 | 2 | 3 | 4 | 5,
      note,
      tags
    };
  
    // Remove the filter that was allowing overwrites
    const updatedData = {
      ...gamificationData,
      moodEntries: [...gamificationData.moodEntries, newEntry],
      lastMoodCheckIn: today
    };
  
    setGamificationData(updatedData);
    await addXP(XP_REWARDS.mood_checkin, 'mood_checkin');
  };

  const checkAchievements = async (habits: Habit[]) => {
    if (!gamificationData || !habits) return;

    for (const achievement of ACHIEVEMENTS) {
      if (gamificationData.unlockedAchievements.includes(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.requirement.type) {
        case 'total_completions':
          const totalCompletions = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0);
          shouldUnlock = totalCompletions >= achievement.requirement.value;
          break;

        case 'streak':
          const maxStreak = Math.max(...habits.map(h => h.streak), 0);
          shouldUnlock = maxStreak >= achievement.requirement.value;
          break;

        case 'habit_count':
          shouldUnlock = habits.length >= achievement.requirement.value;
          break;

        case 'consecutive_days':
          if (achievement.id === 'mood_tracker') {
            const last7Days = Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const offset = date.getTimezoneOffset();
              const localDate = new Date(date.getTime() - (offset * 60 * 1000));
              return localDate.toISOString().split('T')[0];
            });
            const moodEntries = last7Days.every(date => 
              gamificationData.moodEntries.some(entry => entry.date === date)
            );
            shouldUnlock = moodEntries;
          }
          break;

        case 'perfect_week':
          // Check if user completed all habits for 7 consecutive days
          const last7DaysComplete = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            return localDate.toISOString().split('T')[0];
          });
          
          shouldUnlock = last7DaysComplete.every(date => {
            return habits.every(habit => habit.completedDates.includes(date));
          });
          break;
      }

      if (shouldUnlock) {
        await unlockAchievement(achievement.id);
      }
    }
  };

  const getAvailableAchievements = (): Achievement[] => {
    return ACHIEVEMENTS;
  };

  const getTodaysMoodEntry = (): MoodEntry | null => {
    if (!gamificationData) return null;
    const today = getLocalDateString();
    return gamificationData.moodEntries.find(entry => entry.date === today) || null;
  };

  const canCheckMoodToday = (): boolean => {
    return getTodaysMoodEntry() === null;
  };

  const getXPForAction = (action: string): number => {
    return XP_REWARDS[action as keyof typeof XP_REWARDS] || 0;
  };

  const value: GamificationContextType = {
    gamificationData,
    addXP,
    unlockAchievement,
    addMoodEntry,
    checkAchievements,
    getAvailableAchievements,
    getTodaysMoodEntry,
    canCheckMoodToday,
    getXPForAction
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}