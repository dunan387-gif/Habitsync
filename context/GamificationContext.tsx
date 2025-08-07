import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, UserLevel, MoodEntry, StreakMilestone, GamificationData, Habit, HabitMoodEntry } from '@/types';
import { useCelebration } from '@/context/CelebrationContext';
import { useLanguage } from '@/context/LanguageContext';
import { getLocalDateString } from '@/utils/timezone';

// Add AdaptiveChallenge interface
interface AdaptiveChallenge {
  id: string;
  type: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  completed: boolean;
  progress: number;
  target: number;
}

interface GamificationContextType {
  gamificationData: GamificationData | null;
  addXP: (amount: number, source: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  addMoodEntry: (moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm', intensity: number, note?: string, triggers?: ('work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social')[]) => Promise<void>;
  checkAchievements: (habits: Habit[]) => Promise<void>;
  getAvailableAchievements: () => Achievement[];
  getTodaysMoodEntry: () => MoodEntry | null;
  canCheckMoodToday: () => boolean;
  getXPForAction: (action: string) => number;
  // NEW: Habit-Mood Integration
  addHabitMoodEntry: (entry: HabitMoodEntry) => Promise<void>;
  getHabitMoodEntries: (habitId?: string) => HabitMoodEntry[];
  getMoodEntries: () => MoodEntry[];
  // New methods for adaptive challenges
  createAdaptiveChallenge: (type: string, difficulty: 'easy' | 'medium' | 'hard') => Promise<void>;
  completeAdaptiveChallenge: (challengeId: string) => Promise<void>;
  getActiveAdaptiveChallenges: () => AdaptiveChallenge[];
  // Level perks method
  getLevelPerks: (level: number) => string[];
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const INITIAL_GAMIFICATION_DATA: GamificationData = {
  userLevel: {
    level: 1,
    currentXP: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    title: '', // Will be set dynamically using translation keys
    perks: [] // Will be set dynamically using translation keys
  },
  achievements: [],
  unlockedAchievements: [],
  streakMilestones: [],
  moodEntries: [],
  habitMoodEntries: [], // Add missing property
  dailyXPEarned: 0,
  xp: 0 // Add missing xp property
};

const XP_REWARDS = {
  habit_completion: 10,
  streak_milestone: 25,
  mood_checkin: 5,
  perfect_day: 50,
  weekly_goal: 100,
  mood_pattern_discovery: 30,
  resilient_completion: 20,
  mood_improvement: 15,
  emotional_consistency: 25,
  adaptive_challenge: 40
};

const LEVEL_TITLE_KEYS = [
  'gamification.levelTitles.habitBeginner',
  'gamification.levelTitles.routineBuilder', 
  'gamification.levelTitles.consistencySeeker',
  'gamification.levelTitles.habitEnthusiast',
  'gamification.levelTitles.routineMaster',
  'gamification.levelTitles.habitChampion',
  'gamification.levelTitles.lifestyleArchitect',
  'gamification.levelTitles.habitLegend'
];

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_habit',
    titleKey: 'gamification.achievements.firstSteps.title',
    descriptionKey: 'gamification.achievements.firstSteps.description',
    icon: '🌱',
    condition: 'Complete 1 habit total',
    category: 'milestone',
    xpReward: 25,
    rarity: 'common'
  },
  {
    id: 'week_warrior',
    titleKey: 'gamification.achievements.weekWarrior.title',
    descriptionKey: 'gamification.achievements.weekWarrior.description',
    icon: '⚡',
    condition: 'Maintain a 7-day streak',
    category: 'streak',
    xpReward: 100,
    rarity: 'rare'
  },
  {
    id: 'month_master',
    titleKey: 'gamification.achievements.monthMaster.title',
    descriptionKey: 'gamification.achievements.monthMaster.description',
    icon: '🏆',
    condition: 'Maintain a 30-day streak',
    category: 'streak',
    xpReward: 500,
    rarity: 'epic'
  },
  {
    id: 'century_club',
    titleKey: 'gamification.achievements.centuryClub.title',
    descriptionKey: 'gamification.achievements.centuryClub.description',
    icon: '💎',
    condition: 'Maintain a 100-day streak',
    category: 'streak',
    xpReward: 1000,
    rarity: 'legendary'
  },
  {
    id: 'mood_tracker',
    titleKey: 'gamification.achievements.moodTracker.title',
    descriptionKey: 'gamification.achievements.moodTracker.description',
    icon: '😊',
    condition: 'Check mood for 7 consecutive days',
    category: 'mood',
    xpReward: 75,
    rarity: 'common'
  },
  {
    id: 'habit_collector',
    titleKey: 'gamification.achievements.habitCollector.title',
    descriptionKey: 'gamification.achievements.habitCollector.description',
    icon: '📚',
    condition: 'Create 10 different habits',
    category: 'milestone',
    xpReward: 200,
    rarity: 'rare'
  },
  {
    id: 'perfect_week',
    titleKey: 'gamification.achievements.perfectWeek.title',
    descriptionKey: 'gamification.achievements.perfectWeek.description',
    icon: '⭐',
    condition: 'Complete all habits for 7 consecutive days',
    category: 'habit',
    xpReward: 300,
    rarity: 'epic'
  },
  // New Mood-Based Achievements
  {
    id: 'mood_warrior',
    titleKey: 'gamification.achievements.moodWarrior.title',
    descriptionKey: 'gamification.achievements.moodWarrior.description',
    icon: '🛡️',
    condition: 'Track mood for 30 consecutive days',
    category: 'mood',
    xpReward: 200,
    rarity: 'rare'
  },
  {
    id: 'pattern_finder',
    titleKey: 'gamification.achievements.patternFinder.title',
    descriptionKey: 'gamification.achievements.patternFinder.description',
    icon: '🔍',
    condition: 'Identify 5 mood-habit patterns',
    category: 'mood',
    xpReward: 150,
    rarity: 'rare'
  },
  {
    id: 'resilience_builder',
    titleKey: 'gamification.achievements.resilienceBuilder.title',
    descriptionKey: 'gamification.achievements.resilienceBuilder.description',
    icon: '💪',
    condition: 'Complete habits during sad/anxious/stressed moods 20 times',
    category: 'mood',
    xpReward: 250,
    rarity: 'epic'
  },
  {
    id: 'mood_booster',
    titleKey: 'gamification.achievements.moodBooster.title',
    descriptionKey: 'gamification.achievements.moodBooster.description',
    icon: '🌈',
    condition: 'Show mood improvement after habit completion 15 times',
    category: 'mood',
    xpReward: 180,
    rarity: 'rare'
  },
  {
    id: 'emotional_intelligence',
    titleKey: 'gamification.achievements.emotionalIntelligence.title',
    descriptionKey: 'gamification.achievements.emotionalIntelligence.description',
    icon: '🧠',
    condition: 'Complete habits in all mood states (happy, sad, anxious, energetic, tired, stressed, calm)',
    category: 'mood',
    xpReward: 300,
    rarity: 'epic'
  },
  // Adaptive Challenge Achievements
  {
    id: 'adaptive_champion',
    titleKey: 'gamification.achievements.adaptiveChampion.title',
    descriptionKey: 'gamification.achievements.adaptiveChampion.description',
    icon: '🎯',
    condition: 'Complete 10 adaptive challenges',
    category: 'mood',
    xpReward: 200,
    rarity: 'rare'
  },
  {
    id: 'resilience_master',
    titleKey: 'gamification.achievements.resilienceMaster.title',
    descriptionKey: 'gamification.achievements.resilienceMaster.description',
    icon: '🏔️',
    condition: 'Complete 5 resilience challenges',
    category: 'mood',
    xpReward: 250,
    rarity: 'epic'
  },
  {
    id: 'mood_streak_legend',
    titleKey: 'gamification.achievements.moodStreakLegend.title',
    descriptionKey: 'gamification.achievements.moodStreakLegend.description',
    icon: '🔥',
    condition: 'Maintain mood improvement for 14 consecutive days',
    category: 'mood',
    xpReward: 400,
    rarity: 'legendary'
  },
  {
    id: 'difficult_mood_master',
    titleKey: 'gamification.achievements.difficultMoodMaster.title',
    descriptionKey: 'gamification.achievements.difficultMoodMaster.description',
    icon: '⚔️',
    condition: 'Complete habits during difficult moods (sad, anxious, stressed, tired) 30 times',
    category: 'mood',
    xpReward: 350,
    rarity: 'epic'
  },
  {
    id: 'balance_keeper',
    titleKey: 'gamification.achievements.balanceKeeper.title',
    descriptionKey: 'gamification.achievements.balanceKeeper.description',
    icon: '⚖️',
    condition: 'Achieve balanced mood-habit completion for 21 days',
    category: 'mood',
    xpReward: 300,
    rarity: 'epic'
  }
];

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [adaptiveChallenges, setAdaptiveChallenges] = useState<AdaptiveChallenge[]>([]);
  const { showCelebration } = useCelebration();
  
  const unlockedAchievementsRef = useRef<string[]>([]);
  const [isCheckingAchievements, setIsCheckingAchievements] = useState(false);

  // ✅ Update ref whenever gamificationData changes
  useEffect(() => {
    if (gamificationData) {
      unlockedAchievementsRef.current = gamificationData.unlockedAchievements;
    }
  }, [gamificationData]);

  useEffect(() => {
    loadGamificationData();
  }, []);

  useEffect(() => {
    if (gamificationData) {
      // Debounce the save operation to avoid multiple rapid saves
      const timeoutId = setTimeout(() => {
        saveGamificationData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [gamificationData]);

  // Define getLevelPerks function before it's used in useMemo
  const getLevelPerks = (level: number): string[] => {
    const perks = [t('gamification.perks.dailyHabitTracking')];
    if (level >= 3) perks.push(t('gamification.perks.advancedStatistics'));
    if (level >= 5) perks.push(t('gamification.perks.customThemes'));
    if (level >= 10) perks.push(t('gamification.perks.aiHabitSuggestions'));
    if (level >= 15) perks.push(t('gamification.perks.premiumFeatures'));
    return perks;
  };

  // Compute translated title and perks using useMemo to avoid infinite loops
  const translatedGamificationData = useMemo(() => {
    if (!gamificationData || !t) return gamificationData;
    
    return {
      ...gamificationData,
      userLevel: {
        ...gamificationData.userLevel,
        title: t(LEVEL_TITLE_KEYS[Math.min(gamificationData.userLevel.level - 1, LEVEL_TITLE_KEYS.length - 1)]),
        perks: getLevelPerks(gamificationData.userLevel.level)
      }
    };
  }, [gamificationData, t]);


  const loadGamificationData = async () => {
    try {
      const stored = await AsyncStorage.getItem('gamificationData');
      if (stored) {
        const data = JSON.parse(stored);
        const loadedData = { ...INITIAL_GAMIFICATION_DATA, ...data, achievements: ACHIEVEMENTS };
        setGamificationData(loadedData);
      } else {
        const initialData = { ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS };
        setGamificationData(initialData);
      }
    } catch (error) {
      console.error('Failed to load gamification data:', error);
      const fallbackData = { ...INITIAL_GAMIFICATION_DATA, achievements: ACHIEVEMENTS };
      setGamificationData(fallbackData);
    }
  };

  const saveGamificationData = async () => {
    if (!gamificationData) return;
    console.log('💾 Saving gamification data...');
    try {
      await AsyncStorage.setItem('gamificationData', JSON.stringify(gamificationData));
      console.log('✅ Gamification data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save gamification data:', error);
    }
  };

  const calculateXPToNextLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  const addXP = async (amount: number, source: string) => {
    console.log('🎯 addXP called with:', { amount, source });
    
    if (!gamificationData) {
      console.log('❌ No gamification data available for XP');
      return;
    }

    const newTotalXP = gamificationData.userLevel.totalXP + amount;
    const newCurrentXP = gamificationData.userLevel.currentXP + amount;
    let newLevel = gamificationData.userLevel.level;
    let xpToNextLevel = gamificationData.userLevel.xpToNextLevel;

    console.log('📊 XP calculation:', {
      currentLevel: newLevel,
      currentXP: gamificationData.userLevel.currentXP,
      newCurrentXP,
      xpToNextLevel,
      amount
    });

    // Check for level up
    while (newCurrentXP >= xpToNextLevel) {
      newLevel++;
      const remainingXP = newCurrentXP - xpToNextLevel;
      xpToNextLevel = calculateXPToNextLevel(newLevel);
      
      console.log('🎉 Level up! New level:', newLevel);
      
      // Show level up celebration
      showCelebration('level_up', t('gamification.messages.levelUp', { level: newLevel }));
    }

    const updatedData = {
      ...gamificationData,
      userLevel: {
        level: newLevel,
        currentXP: newCurrentXP >= xpToNextLevel ? newCurrentXP - xpToNextLevel : newCurrentXP,
        xpToNextLevel,
        totalXP: newTotalXP,
        title: t(LEVEL_TITLE_KEYS[Math.min(newLevel - 1, LEVEL_TITLE_KEYS.length - 1)]),
        perks: getLevelPerks(newLevel)
      },
      dailyXPEarned: gamificationData.dailyXPEarned + amount
    };

    console.log('💾 Setting gamification data for XP update...');
    try {
      setGamificationData(updatedData);
      console.log('✅ XP update completed');
    } catch (error) {
      console.error('❌ Error setting gamification data for XP:', error);
      throw error;
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    // ✅ Check both state and ref for immediate synchronous check
    if (!gamificationData || 
        gamificationData.unlockedAchievements.includes(achievementId) ||
        unlockedAchievementsRef.current.includes(achievementId)) {
      console.log(`Achievement ${achievementId} already unlocked, skipping`);
      return;
    }
  
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      console.log(`Achievement ${achievementId} not found`);
      return;
    }
  
    console.log(`Unlocking achievement: ${t(achievement.titleKey || '')}`);
  
    // ✅ Update ref immediately for synchronous access
    unlockedAchievementsRef.current = [...unlockedAchievementsRef.current, achievementId];
    
    // ✅ Calculate all updates in one go to prevent race conditions
    const newTotalXP = gamificationData.userLevel.totalXP + achievement.xpReward;
    const newCurrentXP = gamificationData.userLevel.currentXP + achievement.xpReward;
    let newLevel = gamificationData.userLevel.level;
    let xpToNextLevel = gamificationData.userLevel.xpToNextLevel;
  
        // Check for level up
    while (newCurrentXP >= xpToNextLevel) {
      newLevel++;
      const remainingXP = newCurrentXP - xpToNextLevel;
      xpToNextLevel = calculateXPToNextLevel(newLevel);
      
      // Show level up celebration
      showCelebration('level_up', t('gamification.messages.levelUp', { level: newLevel }));
    }

    // ✅ Update state with both achievement and XP in single update
    const updatedData = {
      ...gamificationData,
      unlockedAchievements: [...gamificationData.unlockedAchievements, achievementId],
      userLevel: {
        level: newLevel,
        currentXP: newCurrentXP >= xpToNextLevel ? newCurrentXP - xpToNextLevel : newCurrentXP,
        xpToNextLevel,
        totalXP: newTotalXP,
        title: t(LEVEL_TITLE_KEYS[Math.min(newLevel - 1, LEVEL_TITLE_KEYS.length - 1)]),
        perks: getLevelPerks(newLevel)
      },
      dailyXPEarned: gamificationData.dailyXPEarned + achievement.xpReward
    };

    try {
      setGamificationData(updatedData);
      console.log('✅ Achievement data updated');
    } catch (error) {
      console.error('❌ Error setting gamification data for achievement:', error);
      throw error;
    }
    
    // ✅ Show celebration after state update
    showCelebration('achievement', t('gamification.messages.achievementUnlocked', { title: t(achievement.titleKey || '') }));
  };

  const checkAchievements = async (habits: Habit[]) => {
    if (!gamificationData || isCheckingAchievements) return;
    
    setIsCheckingAchievements(true);
    
    try {
      for (const achievement of ACHIEVEMENTS) {
        if (unlockedAchievementsRef.current.includes(achievement.id)) {
          continue;
        }
        
        let shouldUnlock = false;
  
        switch (achievement.category) {
          case 'milestone':
            if (achievement.id === 'first_habit') {
              const totalCompletions = habits.reduce((sum, habit) => sum + habit.completedDates.length, 0);
              shouldUnlock = totalCompletions >= 1;
            } else if (achievement.id === 'habit_collector') {
              shouldUnlock = habits.length >= 10;
            }
            break;
  
          case 'streak':
            const maxStreak = Math.max(...habits.map(h => h.streak), 0);
            if (achievement.id === 'week_warrior') {
              shouldUnlock = maxStreak >= 7;
            } else if (achievement.id === 'month_master') {
              shouldUnlock = maxStreak >= 30;
            } else if (achievement.id === 'century_club') {
              shouldUnlock = maxStreak >= 100;
            }
            break;
  
          case 'mood':
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
            } else if (achievement.id === 'mood_warrior') {
              // Check for 30 consecutive days of mood tracking
              const last30Days = Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const offset = date.getTimezoneOffset();
                const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                return localDate.toISOString().split('T')[0];
              });
              shouldUnlock = last30Days.every(date => 
                gamificationData.moodEntries.some(entry => entry.date === date)
              );
            } else if (achievement.id === 'pattern_finder') {
              // Count discovered mood-habit correlations
              const correlations = analyzeHabitMoodCorrelations();
              shouldUnlock = correlations.length >= 5;
            } else if (achievement.id === 'resilience_builder') {
              // Count habits completed during low moods
              const lowMoodCompletions = gamificationData.habitMoodEntries.filter(entry => 
                entry.action === 'completed' && 
                entry.preMood && 
                ['sad', 'anxious', 'stressed'].includes(entry.preMood.moodState)
              ).length;
              shouldUnlock = lowMoodCompletions >= 20;
            } else if (achievement.id === 'mood_booster') {
              // Count mood improvements after habit completion
              const moodImprovements = gamificationData.habitMoodEntries.filter(entry => 
                entry.action === 'completed' && 
                entry.preMood && entry.postMood &&
                entry.postMood.intensity > entry.preMood.intensity
              ).length;
              shouldUnlock = moodImprovements >= 15;
            } else if (achievement.id === 'emotional_intelligence') {
              // Check if habits completed in all mood states
              const allMoodStates = ['happy', 'sad', 'anxious', 'energetic', 'tired', 'stressed', 'calm'] as const;
              const completedMoodStates = new Set(
                gamificationData.habitMoodEntries
                  .filter(entry => entry.action === 'completed' && entry.preMood)
                  .map(entry => entry.preMood!.moodState)
              );
              shouldUnlock = allMoodStates.every(mood => completedMoodStates.has(mood));
            } else if (achievement.id === 'difficult_mood_master') {
              // Count habits completed during difficult moods
              const difficultMoodCompletions = gamificationData.habitMoodEntries.filter(entry => 
                entry.action === 'completed' && 
                entry.preMood && 
                ['sad', 'anxious', 'stressed', 'tired'].includes(entry.preMood.moodState)
              ).length;
              shouldUnlock = difficultMoodCompletions >= 30;
            }
            // Add more mood-based achievement checks here
            break;
        }

        if (shouldUnlock) {
          await unlockAchievement(achievement.id);
        }
      }
    } finally {
      setIsCheckingAchievements(false);
    }
  };

  // Helper function to analyze mood-habit correlations
  const analyzeHabitMoodCorrelations = () => {
    if (!gamificationData) return [];
    
    const correlations = [];
    const habitGroups = gamificationData.habitMoodEntries.reduce((acc, entry) => {
      if (!acc[entry.habitId]) acc[entry.habitId] = [];
      acc[entry.habitId].push(entry);
      return acc;
    }, {} as Record<string, HabitMoodEntry[]>);
    
    for (const [habitId, entries] of Object.entries(habitGroups)) {
      if (entries.length < 5) continue; // Need minimum data
      
      const moodSuccessRates = entries.reduce((acc, entry) => {
        if (entry.preMood) {
          const mood = entry.preMood.moodState;
          if (!acc[mood]) acc[mood] = { completed: 0, total: 0 };
          acc[mood].total++;
          if (entry.action === 'completed') acc[mood].completed++;
        }
        return acc;
      }, {} as Record<string, { completed: number; total: number }>);
      
      // Check if there's a significant correlation (>20% difference)
      const rates = Object.values(moodSuccessRates).map(r => r.completed / r.total);
      const maxRate = Math.max(...rates);
      const minRate = Math.min(...rates);
      
      if (maxRate - minRate > 0.2) {
        correlations.push({ habitId, correlation: maxRate - minRate });
      }
    }
    
    return correlations;
  };

  const addMoodEntry = async (
    moodState: 'happy' | 'sad' | 'anxious' | 'energetic' | 'tired' | 'stressed' | 'calm', 
    intensity: number, 
    note?: string, 
    triggers?: ('work' | 'relationships' | 'health' | 'weather' | 'sleep' | 'exercise' | 'social')[]
  ): Promise<void> => {
    console.log('🎯 addMoodEntry called with:', { moodState, intensity, note, triggers });
    
    try {
      if (!gamificationData) {
        console.error('❌ No gamification data available');
        throw new Error('No gamification data available');
      }

      const today = getLocalDateString();
      console.log('📅 Today\'s date:', today);
      
      const existingEntryIndex = gamificationData.moodEntries.findIndex(entry => entry.date === today);
      console.log('🔍 Existing entry index:', existingEntryIndex);
      
      let updatedEntries;
      if (existingEntryIndex !== -1) {
        // Update existing entry
        const existingEntry = gamificationData.moodEntries[existingEntryIndex];
        const updatedEntry: MoodEntry = {
          ...existingEntry,
          moodState,
          intensity,
          triggers: triggers || existingEntry.triggers,
          note: note || existingEntry.note,
          timestamp: new Date().toISOString() // Update timestamp
        };
        
        updatedEntries = [...gamificationData.moodEntries];
        updatedEntries[existingEntryIndex] = updatedEntry;
        console.log('✅ Updated existing mood entry:', updatedEntry);
      } else {
        // Create new entry
        const newEntry: MoodEntry = {
          id: `mood_${Date.now()}`,
          date: today,
          moodState,
          intensity,
          triggers,
          note,
          timestamp: new Date().toISOString()
        };
        
        updatedEntries = [...gamificationData.moodEntries, newEntry];
        console.log('✅ Created new mood entry:', newEntry);
      }
      
      const updatedData = {
        ...gamificationData,
        moodEntries: updatedEntries
      };
      
      console.log('💾 Setting gamification data...');
      try {
        setGamificationData(updatedData);
        console.log('✅ Gamification data updated');
      } catch (error) {
        console.error('❌ Error setting gamification data:', error);
        throw error;
      }
      
      // Add XP for mood check-in with a small delay to avoid race conditions
      console.log('⭐ Adding XP for mood check-in...');
      setTimeout(async () => {
        try {
          await addXP(XP_REWARDS.mood_checkin, 'mood_checkin');
          console.log('✅ XP added successfully');
        } catch (error) {
          console.error('❌ Error adding XP:', error);
        }
      }, 50);
      
    } catch (error) {
      console.error('❌ Error in addMoodEntry:', error);
      throw error;
    }
  };
  const addHabitMoodEntry = async (entry: HabitMoodEntry) => {
    if (!gamificationData) return;
    
    const updatedData = {
      ...gamificationData,
      habitMoodEntries: [...(gamificationData.habitMoodEntries || []), entry]
    };
    
    try {
      setGamificationData(updatedData);
      console.log('✅ Habit mood entry added successfully');
    } catch (error) {
      console.error('❌ Error adding habit mood entry:', error);
      throw error;
    }
  };
  
  // NEW: Get habit-mood entries
  const getHabitMoodEntries = (habitId?: string): HabitMoodEntry[] => {
    if (!gamificationData) return [];
    
    const entries = gamificationData.habitMoodEntries || [];
    return habitId ? entries.filter(entry => entry.habitId === habitId) : entries;
  };

  const getMoodEntries = (): MoodEntry[] => {
    console.log('🔍 getMoodEntries called');
    if (!gamificationData) {
      console.log('❌ No gamificationData in getMoodEntries');
      return [];
    }
    const entries = gamificationData.moodEntries || [];
    console.log('📊 Returning mood entries:', entries.length, 'entries');
    console.log('📊 Mood entries details:', entries.map(e => ({ date: e.date, mood: e.moodState })));
    return entries;
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
    // Always allow mood updates - the addMoodEntry function will handle updating existing entries
    return true;
  };

  const getXPForAction = (action: string): number => {
    return XP_REWARDS[action as keyof typeof XP_REWARDS] || 0;
  };

  // Adaptive Challenge Functions
  const createAdaptiveChallenge = async (type: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<void> => {
    const newChallenge: AdaptiveChallenge = {
      id: `challenge_${Date.now()}`,
      type,
      difficulty,
      createdAt: new Date().toISOString(),
      completed: false,
      progress: 0,
      target: difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7
    };
    
    try {
      setAdaptiveChallenges(prev => [...prev, newChallenge]);
      console.log('✅ Adaptive challenge created successfully');
      await addXP(XP_REWARDS.adaptive_challenge, 'adaptive_challenge_created');
    } catch (error) {
      console.error('❌ Error creating adaptive challenge:', error);
      throw error;
    }
  };

  const completeAdaptiveChallenge = async (challengeId: string): Promise<void> => {
    try {
      setAdaptiveChallenges(prev => 
        prev.map(challenge => 
          challenge.id === challengeId 
            ? { ...challenge, completed: true, progress: challenge.target }
            : challenge
        )
      );
      console.log('✅ Adaptive challenge completed successfully');
      await addXP(XP_REWARDS.adaptive_challenge, 'adaptive_challenge_completed');
    } catch (error) {
      console.error('❌ Error completing adaptive challenge:', error);
      throw error;
    }
  };

  const getActiveAdaptiveChallenges = (): AdaptiveChallenge[] => {
    return adaptiveChallenges.filter(challenge => !challenge.completed);
  };

  return (
    <GamificationContext.Provider value={{
      gamificationData: translatedGamificationData,
      addXP,
      unlockAchievement,
      addMoodEntry,
      checkAchievements,
      getAvailableAchievements,
      getTodaysMoodEntry,
      canCheckMoodToday,
      getXPForAction,
      // NEW: Habit-Mood Integration
      addHabitMoodEntry,
      getHabitMoodEntries,
      getMoodEntries,
      // Adaptive challenge methods
      createAdaptiveChallenge,
      completeAdaptiveChallenge,
      getActiveAdaptiveChallenges,
      // Level perks method
      getLevelPerks
    }}>      {children}
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